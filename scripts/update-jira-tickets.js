#!/usr/bin/env node
/**
 * Update Jira tickets with markdown content converted to ADF format
 * Uses marklassian library for reliable markdown-to-ADF conversion
 */

import 'dotenv/config';
import { markdownToAdf } from 'marklassian';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Jira configuration from environment variables
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'QA';
const JIRA_TICKETS_PATH = process.env.JIRA_TICKETS_PATH || 'possible_tickets';

// Validate required environment variables
if (!JIRA_BASE_URL) {
  console.error('❌ Error: JIRA_BASE_URL environment variable is required');
  process.exit(1);
}
if (!JIRA_EMAIL) {
  console.error('❌ Error: JIRA_EMAIL environment variable is required');
  process.exit(1);
}
if (!JIRA_API_TOKEN) {
  console.error('❌ Error: JIRA_API_TOKEN environment variable is required');
  process.exit(1);
}

// Ticket mappings
// Note: QA-5 through QA-12 and QA-21 through QA-28 are already updated, only updating new tickets
const TICKETS = {
  'QA_TICKET_QA_29_ADMIN_LOGIN_VALID_CREDENTIALS.md': 'QA-29',
  'QA_TICKET_QA_30_ADMIN_LOGIN_INVALID_CREDENTIALS.md': 'QA-30',
  'QA_TICKET_QA_31_ADMIN_LOGIN_NON_ADMIN_USER.md': 'QA-31',
  'QA_TICKET_QA_32_ADMIN_LOGIN_PASSWORD_VISIBILITY_TOGGLE.md': 'QA-32'
};

// Resolve from repo root (parent of scripts/)
const TICKETS_PATH = path.join(__dirname, '..', JIRA_TICKETS_PATH);

/**
 * Make HTTP request to Jira API
 */
function updateJiraTicket(jiraKey, adf) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
    const url = `${JIRA_BASE_URL}/rest/api/3/issue/${jiraKey}`;
    
    const payload = JSON.stringify({
      fields: {
        description: adf
      }
    });

    const options = {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          try {
            const error = JSON.parse(data);
            reject({ 
              success: false, 
              statusCode: res.statusCode, 
              error: error.errorMessages || error.message || data 
            });
          } catch (e) {
            reject({ 
              success: false, 
              statusCode: res.statusCode, 
              error: data 
            });
          }
        }
      });
    });

    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Clean markdown content - remove metadata lines
 */
function cleanMarkdown(markdown) {
  const lines = markdown.split('\n');
  const cleaned = [];
  let skipNext = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip metadata lines at the beginning
    if (i < 20 && (
      line.startsWith('## Project') ||
      line.startsWith('## Issue Type') ||
      line.startsWith('UI Test -') ||
      line.startsWith('**Parent Epic:**') ||
      line.startsWith('**Links to GMP Epics:**') ||
      line === '---'
    )) {
      continue;
    }
    
    cleaned.push(lines[i]);
  }

  return cleaned.join('\n');
}

/**
 * Main function to update all tickets
 */
async function main() {
  console.log('\n=== Updating Jira Tickets ===\n');

  let successCount = 0;
  let failCount = 0;

  for (const [fileName, jiraKey] of Object.entries(TICKETS)) {
    const filePath = path.join(TICKETS_PATH, fileName);
    
    console.log(`Processing ${fileName} -> ${jiraKey}...`);

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`  ✗ File not found: ${filePath}\n`);
        failCount++;
        continue;
      }

      // Read markdown file
      const markdown = fs.readFileSync(filePath, 'utf8');
      
      // Clean markdown (remove metadata)
      const cleanedMarkdown = cleanMarkdown(markdown);
      
      // Convert markdown to ADF
      const adf = markdownToAdf(cleanedMarkdown);
      
      // Update Jira ticket
      const result = await updateJiraTicket(jiraKey, adf);
      
      if (result.success) {
        console.log(`  ✓ Successfully updated ${jiraKey}\n`);
        successCount++;
      } else {
        console.log(`  ✗ Failed to update ${jiraKey}: ${result.error}\n`);
        failCount++;
      }
    } catch (error) {
      console.log(`  ✗ Error processing ${jiraKey}: ${error.error || error.message}\n`);
      failCount++;
    }
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`✓ Success: ${successCount}`);
  console.log(`✗ Failed: ${failCount}`);
  console.log(`Total: ${successCount + failCount}`);
  console.log(`\nView tickets at: ${JIRA_BASE_URL}/browse/${JIRA_PROJECT_KEY}\n`);
}

// Run main function
main().catch(console.error);




