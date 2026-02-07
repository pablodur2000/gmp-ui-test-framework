#!/usr/bin/env node
/**
 * Report a Playwright test run to Notion.
 * Reads the JSON reporter output, creates a page in the "Test Runs" database,
 * and appends: table of passed tests, then each failed test with heading + quote (error).
 *
 * Usage:
 *   node scripts/notion-report-run.js [--report=path]
 *
 * Env: NOTION_API_KEY, NOTION_DATABASE_ID, ENVIRONMENT, ARTIFACT_URL (optional), RUN_NAME (optional)
 * Default report path: playwright-report/results.json
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const ENVIRONMENT = process.env.ENVIRONMENT || 'develop';
const ARTIFACT_URL = process.env.ARTIFACT_URL || '';
const RUN_NAME = process.env.RUN_NAME || '';

const NOTION_API = 'https://api.notion.com/v1';
const RICH_TEXT_MAX = 2000; // Notion block content limit; truncate if longer

function getReportPath() {
  const arg = process.argv.find((a) => a.startsWith('--report='));
  if (arg) return path.resolve(ROOT, arg.slice('--report='.length));
  return path.join(ROOT, 'playwright-report', 'results.json');
}

/**
 * Walk Playwright JSON report and collect passed/failed tests and summary.
 * Handles structure: suites[] -> specs[] -> tests[] -> results[] with outcome, duration, error.
 */
function parseReport(data) {
  const passed = [];
  const failed = [];
  let totalDurationMs = 0;

  function walkSuites(suites) {
    if (!Array.isArray(suites)) return;
    for (const suite of suites) {
      walkSpecs(suite.specs);
      walkSuites(suite.suites);
    }
  }

  function walkSpecs(specs) {
    if (!Array.isArray(specs)) return;
    for (const spec of specs) {
      if (!Array.isArray(spec.tests)) continue;
      for (const test of spec.tests) {
        const title = test.title || spec.title || 'Unnamed test';
        const results = test.results || [];
        const lastResult = results[results.length - 1];
        if (!lastResult) continue;
        const outcome = lastResult.outcome || lastResult.status;
        const durationMs = lastResult.duration ?? 0;
        totalDurationMs += durationMs;
        if (outcome === 'passed' || outcome === 'expected') {
          passed.push(title);
        } else if (outcome === 'failed' || outcome === 'unexpected') {
          const err = lastResult.error || {};
          const message = err.message || 'No error message';
          const stack = err.stack || '';
          failed.push({
            title,
            errorMessage: message,
            errorStack: stack,
          });
        }
        // skipped, timedOut, etc. - not added to passed or failed
      }
    }
  }

  if (data.suites) walkSuites(data.suites);
  return {
    passed,
    failed,
    total: passed.length + failed.length,
    passedCount: passed.length,
    failedCount: failed.length,
    durationMs: totalDurationMs,
    durationSec: Math.round(totalDurationMs / 1000),
  };
}

function truncate(text, max = RICH_TEXT_MAX) {
  if (typeof text !== 'string') return '';
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '…';
}

function richText(content) {
  return [{ type: 'text', text: { content: truncate(content) } }];
}

/**
 * Notion API: GET database to resolve property names to IDs.
 */
async function getDatabasePropertyIds() {
  const res = await fetch(`${NOTION_API}/databases/${NOTION_DATABASE_ID}`, {
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion GET database failed: ${res.status} ${body}`);
  }
  const db = await res.json();
  const ids = {};
  for (const [id, prop] of Object.entries(db.properties || {})) {
    const name = prop.name;
    ids[name] = id;
  }
  return ids;
}

/**
 * Create a page in the Test Runs database.
 * Property names expected: Run date, Run name, Environment, Passed, Failed, Duration, Status, Artifact link
 */
async function createRunPage(ids, summary, runDateIso, runName, artifactUrl) {
  const status = summary.failedCount === 0 ? 'Pass' : summary.passedCount === 0 ? 'Fail' : 'Partial';
  const payload = {
    parent: { database_id: NOTION_DATABASE_ID },
    properties: {},
  };
  const p = payload.properties;

  if (ids['Run date']) {
    p[ids['Run date']] = { date: { start: runDateIso } };
  }
  if (ids['Run name']) {
    p[ids['Run name']] = { title: [{ text: { content: runName } }] };
  }
  if (ids['Environment']) {
    p[ids['Environment']] = { select: { name: ENVIRONMENT } };
  }
  if (ids['Passed']) {
    p[ids['Passed']] = { number: summary.passedCount };
  }
  if (ids['Failed']) {
    p[ids['Failed']] = { number: summary.failedCount };
  }
  if (ids['Duration']) {
    p[ids['Duration']] = { number: summary.durationSec };
  }
  if (ids['Status']) {
    p[ids['Status']] = { select: { name: status } };
  }
  if (ids['Artifact link'] && artifactUrl) {
    p[ids['Artifact link']] = { url: artifactUrl };
  }

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion create page failed: ${res.status} ${body}`);
  }
  const page = await res.json();
  return page.id;
}

/**
 * Append blocks to a page. Notion accepts up to 100 children per request.
 */
async function appendBlocks(pageId, children) {
  const batchSize = 100;
  for (let i = 0; i < children.length; i += batchSize) {
    const batch = children.slice(i, i + batchSize);
    const res = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ children: batch }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Notion append blocks failed: ${res.status} ${body}`);
    }
  }
}

/**
 * Build block children: Passed (heading + table), then each failed (heading + quote).
 */
function buildBlocks(summary) {
  const blocks = [];

  if (summary.passed.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Passed' } }] },
    });
    const headerRow = {
      object: 'block',
      type: 'table_row',
      table_row: {
        cells: [[{ type: 'text', text: { content: 'Test' } }]],
      },
    };
    const dataRows = summary.passed.map((title) => ({
      object: 'block',
      type: 'table_row',
      table_row: {
        cells: [[{ type: 'text', text: { content: truncate(title, 2000) } }]],
      },
    }));
    blocks.push({
      object: 'block',
      type: 'table',
      table: {
        table_width: 1,
        has_column_header: true,
        children: [headerRow, ...dataRows],
      },
    });
  }

  for (const f of summary.failed) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: truncate(f.title, 2000) } }] },
    });
    const errorBody = f.errorStack ? `${f.errorMessage}\n\n${f.errorStack}` : f.errorMessage;
    blocks.push({
      object: 'block',
      type: 'quote',
      quote: { rich_text: richText(errorBody) },
    });
  }

  return blocks;
}

async function main() {
  if (!NOTION_API_KEY || !NOTION_DATABASE_ID) {
    console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID');
    process.exit(1);
  }

  const reportPath = getReportPath();
  if (!fs.existsSync(reportPath)) {
    console.error(`Report file not found: ${reportPath}`);
    process.exit(1);
  }

  let data;
  try {
    const raw = fs.readFileSync(reportPath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse report JSON:', e.message);
    process.exit(1);
  }

  const summary = parseReport(data);
  const now = new Date();
  const runDateIso = now.toISOString().slice(0, 10);
  const timeStr = now.toISOString().slice(11, 19);
  const runName =
    RUN_NAME || `Regression ${ENVIRONMENT} ${runDateIso} ${timeStr} UTC`;

  try {
    const ids = await getDatabasePropertyIds();
    const pageId = await createRunPage(
      ids,
      summary,
      runDateIso,
      runName,
      ARTIFACT_URL
    );
    const children = buildBlocks(summary);
    if (children.length > 0) {
      await appendBlocks(pageId, children);
    }
    console.log('Notion report created successfully.');
    console.log(`Page ID: ${pageId}`);
  } catch (e) {
    console.error('Notion report failed:', e.message);
    process.exit(1);
  }
}

main();
