#!/usr/bin/env node
/**
 * Report a Playwright test run to Notion.
 * Page order: Regression summary (AI, when enabled and there are failures), Failed tests first, then Passed table.
 * AI: one request per run with all failure context; output is placed at the top. Context is capped to stay within API limits.
 *
 * Usage:
 *   node scripts/notion-report-run.js [--report=path]
 *
 * Env:
 *   NOTION_API_KEY, NOTION_DATABASE_ID (required)
 *   ENVIRONMENT, ARTIFACT_URL, RUN_NAME (optional)
 *   AI summary (optional): AI_SUMMARY_ENABLED=1 and either GROQ_API_KEY or GEMINI_API_KEY
 *     - Multiple keys: comma-separated (e.g. GROQ_API_KEY=key1,key2); we try each in order and fall back on failure
 *     - Groq: free tier, no card; get key at https://console.groq.com/keys
 *     - Gemini: free tier; get key at https://aistudio.google.com/apikey
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
const AI_SUMMARY_ENABLED = process.env.AI_SUMMARY_ENABLED === '1' || process.env.AI_SUMMARY_ENABLED === 'true';
// Multiple keys supported: comma-separated; we try each in order and fall back to the next on failure (e.g. rate limit).
const GROQ_API_KEYS = (process.env.GROQ_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);
const GEMINI_API_KEYS = (process.env.GEMINI_API_KEY || '')
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

const NOTION_API = 'https://api.notion.com/v1';
const RICH_TEXT_MAX = 2000; // Notion block content limit; truncate if longer

// AI summary: one request with all failures in context; caps to stay within API input limits (~4k tokens)
const AI_CONTEXT_MAX_CHARS = 12000; // total failure context sent in the single request (~3k tokens)
const AI_CONTEXT_PER_ERROR_CHARS = 1500; // max chars per failed test error in that context

function getReportPath() {
  const arg = process.argv.find((a) => a.startsWith('--report='));
  if (arg) return path.resolve(ROOT, arg.slice('--report='.length));
  return path.join(ROOT, 'playwright-report', 'results.json');
}

/**
 * Build full test label for display (e.g. "[chromium] › file › suite › title").
 */
function fullTestTitle(spec, test, projectName) {
  const parts = [];
  if (projectName) parts.push(projectName);
  if (spec?.file) parts.push(spec.file);
  if (spec?.title) parts.push(spec.title);
  const title = test?.title || spec?.title || 'Unnamed test';
  parts.push(title);
  return parts.join(' › ');
}

/**
 * Strip lines that mention attachments (screenshot, video, trace, test-results paths, Usage: npx).
 * Keeps error message, call log, code snippet, file:line.
 */
function stripErrorAttachments(text) {
  if (typeof text !== 'string') return '';
  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    const t = line.trim();
    if (/attachment\s*#\d+/i.test(t)) continue;
    if (/test-results\//.test(t)) continue;
    if (/Error Context:\s*test-results/.test(t)) continue;
    if (/Usage:\s*npx playwright show-trace/.test(t)) continue;
    if (/trace\.zip/.test(t) && !/at\s+/.test(t)) continue;
    if (/^[-─\s]+$/.test(t)) continue;
    if (/^attachment\s*#\d+/i.test(t)) continue;
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Walk Playwright JSON report and collect passed/failed tests and summary.
 * Handles structure: suites[] -> specs[] -> tests[] -> results[] with outcome, duration, error.
 * Passed: { title, durationMs, status }. Failed: { fullTitle, errorBody } with all retries, attachments stripped.
 */
function parseReport(data) {
  const passed = [];
  const failed = [];
  let totalDurationMs = 0;
  const projectName = data.config?.projects?.[0]?.name || '';

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
        const fullTitle = fullTestTitle(spec, test, projectName);
        const results = test.results || [];
        const lastResult = results[results.length - 1];
        if (!lastResult) continue;
        const outcome = lastResult.outcome || lastResult.status;
        const durationMs = lastResult.duration ?? 0;
        totalDurationMs += durationMs;
        if (outcome === 'passed' || outcome === 'expected') {
          passed.push({
            title,
            durationMs,
            status: 'Passed',
          });
        } else if (outcome === 'failed' || outcome === 'unexpected') {
          const parts = [];
          results.forEach((r, i) => {
            const err = r.error || {};
            const msg = err.message || 'No error message';
            const stack = err.stack || '';
            if (results.length > 1) {
              parts.push(`Run ${i + 1}: ${msg}`);
              if (stack) parts.push(stack);
            } else {
              parts.push(msg);
              if (stack) parts.push(stack);
            }
          });
          const rawError = parts.join('\n\n');
          failed.push({
            fullTitle,
            title,
            errorBody: stripErrorAttachments(rawError),
          });
        }
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

/**
 * One AI request with all failed tests' error context; result is shown at the top of the Notion report.
 * Context is capped so the single request stays within typical API input limits (~4k tokens).
 * Multiple keys (comma-separated in env) are tried in order; we fall back to the next key on failure (e.g. rate limit).
 */
async function getAISummary(failedList) {
  if (!failedList || failedList.length === 0 || !AI_SUMMARY_ENABLED) return null;
  const failedText = failedList
    .map(
      (f) =>
        `Test: ${f.fullTitle || f.title}\nError: ${(f.errorBody || '').slice(0, AI_CONTEXT_PER_ERROR_CHARS)}`
    )
    .join('\n\n---\n\n');
  const prompt = `You are summarizing a UI test regression run. Below are the failed test names and their error messages. In 2-4 short sentences, summarize what failed and suggest likely causes or areas to check. Be concise and actionable.\n\n${truncate(failedText, AI_CONTEXT_MAX_CHARS)}`;

  for (const key of GROQ_API_KEYS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (e) {
      console.warn('Groq AI summary failed (trying next key or provider):', e.message);
    }
  }

  for (const key of GEMINI_API_KEYS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) return text;
    } catch (e) {
      console.warn('Gemini AI summary failed (trying next key or provider):', e.message);
    }
  }

  return null;
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
 * Format duration for table (e.g. "2.5s" or "0.1s").
 */
function formatDuration(durationMs) {
  if (durationMs == null || durationMs < 0) return '';
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(1)}s`;
}

/**
 * Build block children: Failed first (heading + each failure), then Passed (heading + table).
 * Optionally prepend "Regression summary" (AI) when aiSummaryText is provided.
 */
function buildBlocks(summary, aiSummaryText = null) {
  const blocks = [];

  if (aiSummaryText) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ type: 'text', text: { content: 'Regression summary' } }] },
    });
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: richText(aiSummaryText) },
    });
  }

  if (summary.failed.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: 'Failed tests' } }],
      },
    });
    for (const f of summary.failed) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: truncate(f.fullTitle || f.title, 2000) } }],
        },
      });
      const errorBody =
        f.errorBody ||
        (f.errorMessage && f.errorStack
          ? `${f.errorMessage}\n\n${f.errorStack}`
          : f.errorMessage) ||
        'No error details';
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: { rich_text: richText(errorBody) },
      });
    }
  }

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
        cells: [
          [{ type: 'text', text: { content: 'Test' } }],
          [{ type: 'text', text: { content: 'Duration' } }],
          [{ type: 'text', text: { content: 'Status' } }],
        ],
      },
    };
    const dataRows = summary.passed.map((p) => ({
      object: 'block',
      type: 'table_row',
      table_row: {
        cells: [
          [{ type: 'text', text: { content: truncate(p.title, 2000) } }],
          [{ type: 'text', text: { content: formatDuration(p.durationMs) } }],
          [{ type: 'text', text: { content: p.status || 'Passed' } }],
        ],
      },
    }));
    blocks.push({
      object: 'block',
      type: 'table',
      table: {
        table_width: 3,
        has_column_header: true,
        children: [headerRow, ...dataRows],
      },
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
    let aiSummaryText = null;
    if (
      summary.failed.length > 0 &&
      AI_SUMMARY_ENABLED &&
      (GROQ_API_KEYS.length > 0 || GEMINI_API_KEYS.length > 0)
    ) {
      aiSummaryText = await getAISummary(summary.failed);
    }
    const children = buildBlocks(summary, aiSummaryText);
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
