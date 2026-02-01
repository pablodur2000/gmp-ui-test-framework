#!/usr/bin/env node
/**
 * General script to create Jira ticket from markdown file
 * 
 * Usage:
 *   node create-ticket-from-md.js <path-to-markdown-file>
 *   node create-ticket-from-md.js possible_tickets/QA_TICKET_QA_21_CATALOG_LOADS_ALL_PRODUCTS.md
 * 
 * Or process multiple files:
 *   node create-ticket-from-md.js possible_tickets/QA_TICKET_QA_*.md
 */

import 'dotenv/config';
import { markdownToAdf } from 'marklassian';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Jira configuration from environment variables
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'QA';

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

// Issue Type IDs for QA project
const ISSUE_TYPE_IDS = {
  'Epic': '10042',
  'Story': '10041',
  'Task': '10039',
  'Bug': '10040',
  'Subtask': '10043'
};

/**
 * Parse markdown file to extract ticket metadata
 */
function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const metadata = {
    title: '',
    project: JIRA_PROJECT_KEY,
    issueType: 'Story',
    summary: '',
    parentEpic: null,
    linksToGmpEpics: [],
    description: '',
    jiraKey: null
  };
  
  let inMetadata = true;
  let descriptionStart = false;
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Extract title from H1
    if (trimmed.startsWith('# QA Ticket:') || trimmed.startsWith('# QA Ticket')) {
      metadata.title = trimmed.replace(/^# QA Ticket:\s*/, '').replace(/\s*\(QA-\d+\)$/, '').trim();
      // Extract Jira key from title if present
      const keyMatch = trimmed.match(/\(QA-(\d+)\)/);
      if (keyMatch) {
        metadata.jiraKey = `QA-${keyMatch[1]}`;
      }
    }
    
    // Extract Project
    if (trimmed === '## Project') {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine) {
        const projectMatch = nextLine.match(/QA\s*\(QA\)/);
        if (projectMatch) {
          metadata.project = JIRA_PROJECT_KEY;
        }
      }
    }
    
    // Extract Issue Type
    if (trimmed === '## Issue Type') {
      const nextLine = lines[i + 1]?.trim();
      if (nextLine) {
        metadata.issueType = nextLine;
      }
    }
    
    // Extract Summary (from "UI Test - ...")
    if (trimmed.startsWith('UI Test -')) {
      metadata.summary = trimmed.replace(/^UI Test -\s*/, '').replace(/\s*\(QA-\d+\)$/, '').trim();
    }
    
    // Extract Parent Epic
    if (trimmed.startsWith('**Parent Epic:**')) {
      const epicMatch = trimmed.match(/QA-(\d+)/);
      if (epicMatch) {
        metadata.parentEpic = `QA-${epicMatch[1]}`;
      }
    }
    
    // Extract Links to GMP Epics
    if (trimmed.startsWith('**Links to GMP Epics:**')) {
      const gmpEpicsMatch = trimmed.match(/GMP-(\d+)/g);
      if (gmpEpicsMatch) {
        metadata.linksToGmpEpics = gmpEpicsMatch;
      }
    }
    
    // Start description after metadata section (after "---")
    if (trimmed === '---' && inMetadata) {
      inMetadata = false;
      descriptionStart = true;
      continue;
    }
    
    // Collect description (everything after metadata)
    if (!inMetadata && descriptionStart) {
      // Skip the first "## 📋 Description" header
      if (trimmed === '## 📋 Description' || trimmed === '## Description') {
        continue;
      }
      metadata.description += line + '\n';
    }
  }
  
  // Clean up description
  metadata.description = metadata.description.trim();
  
  return metadata;
}

/**
 * Clean markdown for description (remove metadata)
 */
function cleanMarkdownForDescription(markdown) {
  const lines = markdown.split('\n');
  const cleaned = [];
  let inMetadata = true;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Stop at first "---" after metadata
    if (line === '---' && inMetadata) {
      inMetadata = false;
      continue;
    }
    
    // Skip metadata lines
    if (inMetadata && (
      line.startsWith('# QA Ticket:') ||
      line.startsWith('## Project') ||
      line.startsWith('## Issue Type') ||
      line.startsWith('UI Test -') ||
      line.startsWith('**Parent Epic:**') ||
      line.startsWith('**Links to GMP Epics:**') ||
      line === '---'
    )) {
      continue;
    }
    
    // Skip "## 📋 Description" header
    if (!inMetadata && (line === '## 📋 Description' || line === '## Description')) {
      continue;
    }
    
    if (!inMetadata) {
      cleaned.push(lines[i]);
    }
  }
  
  return cleaned.join('\n');
}

/**
 * Create "Relates to" link between tickets
 */
async function createIssueLink(sourceKey, targetKey) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const url = `${JIRA_BASE_URL}/rest/api/3/issueLink`;
  
  const payload = {
    type: {
      name: 'Relates'
    },
    inwardIssue: {
      key: sourceKey
    },
    outwardIssue: {
      key: targetKey
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      // If link already exists, that's okay
      if (errorText.includes('already') || errorText.includes('duplicate')) {
        return { success: true, alreadyExists: true };
      }
      throw new Error(`Failed to create link: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return { success: true, alreadyExists: false };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create ticket in Jira
 */
async function createTicket(metadata) {
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const url = `${JIRA_BASE_URL}/rest/api/3/issue`;
  
  // Check if ticket already exists
  if (metadata.jiraKey) {
    try {
      const checkUrl = `${JIRA_BASE_URL}/rest/api/3/issue/${metadata.jiraKey}`;
      const checkResponse = await fetch(checkUrl, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
      });
      
      if (checkResponse.ok) {
        // Ticket exists, but we should still create links if they don't exist
        const linkResults = [];
        if (metadata.linksToGmpEpics && metadata.linksToGmpEpics.length > 0) {
          for (const gmpEpic of metadata.linksToGmpEpics) {
            const linkResult = await createIssueLink(metadata.jiraKey, gmpEpic);
            linkResults.push({ epic: gmpEpic, ...linkResult });
          }
        }
        
        return { 
          success: true, 
          key: metadata.jiraKey, 
          alreadyExists: true,
          message: `Ticket ${metadata.jiraKey} already exists`,
          linksCreated: linkResults
        };
      }
    } catch (e) {
      // Ticket doesn't exist, continue with creation
    }
  }
  
  // Convert description to ADF
  const descriptionAdf = metadata.description 
    ? markdownToAdf(cleanMarkdownForDescription(metadata.description))
    : {
        type: 'doc',
        version: 1,
        content: [{
          type: 'paragraph',
          content: [{ type: 'text', text: 'Description will be updated from markdown file.' }]
        }]
      };
  
  const payload = {
    fields: {
      project: {
        key: metadata.project
      },
      summary: metadata.summary || metadata.title,
      description: descriptionAdf,
      issuetype: {
        id: ISSUE_TYPE_IDS[metadata.issueType] || ISSUE_TYPE_IDS['Story']
      }
    }
  };
  
  // Add parent Epic if specified
  // In Jira, Stories under Epics use the "parent" field
  if (metadata.parentEpic) {
    payload.fields.parent = {
      key: metadata.parentEpic
    };
  }
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create ticket: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const responseData = await response.json();
    const createdKey = responseData.key;
    
    // Create "Relates to" links to GMP Epics if specified
    const linkResults = [];
    if (metadata.linksToGmpEpics && metadata.linksToGmpEpics.length > 0) {
      for (const gmpEpic of metadata.linksToGmpEpics) {
        const linkResult = await createIssueLink(createdKey, gmpEpic);
        linkResults.push({ epic: gmpEpic, ...linkResult });
      }
    }
    
    return { 
      success: true, 
      key: createdKey, 
      id: responseData.id,
      alreadyExists: false,
      linksCreated: linkResults
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node create-ticket-from-md.js <markdown-file-path>');
    console.error('Example: node create-ticket-from-md.js possible_tickets/QA_TICKET_QA_21_CATALOG_LOADS_ALL_PRODUCTS.md');
    process.exit(1);
  }
  
  console.log('🚀 Creating Jira Tickets from Markdown Files');
  console.log('==========================================\n');
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  // Process each file
  for (const fileArg of args) {
    // Handle glob patterns (basic support)
    const files = fileArg.includes('*') 
      ? [] // Would need glob library for full support
      : [fileArg];
    
    if (files.length === 0) {
      // For now, just process the single file
      files.push(fileArg);
    }
    
    for (const filePath of files) {
      const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(__dirname, filePath);
      
      console.log(`📋 Processing: ${filePath}...`);
      
      if (!fs.existsSync(fullPath)) {
        console.error(`   ❌ File not found: ${fullPath}\n`);
        failCount++;
        continue;
      }
      
      try {
        // Parse markdown
        const metadata = parseMarkdownFile(fullPath);
        
        console.log(`   Title: ${metadata.title}`);
        console.log(`   Summary: ${metadata.summary}`);
        console.log(`   Issue Type: ${metadata.issueType}`);
        if (metadata.parentEpic) {
          console.log(`   Parent Epic: ${metadata.parentEpic}`);
        }
        if (metadata.jiraKey) {
          console.log(`   Expected Key: ${metadata.jiraKey}`);
        }
        
        // Create ticket
        const result = await createTicket(metadata);
        
        if (result.success) {
          if (result.alreadyExists) {
            console.log(`   ⚠️  ${result.message}`);
            
            // Show link creation results for existing tickets too
            if (result.linksCreated && result.linksCreated.length > 0) {
              for (const link of result.linksCreated) {
                if (link.success) {
                  if (link.alreadyExists) {
                    console.log(`      🔗 Link to ${link.epic} already exists`);
                  } else {
                    console.log(`      🔗 Linked to ${link.epic}`);
                  }
                } else {
                  console.log(`      ⚠️  Failed to link to ${link.epic}: ${link.error}`);
                }
              }
            }
            console.log('');
            skipCount++;
          } else {
            console.log(`   ✅ Created: ${result.key}`);
            
            // Show link creation results
            if (result.linksCreated && result.linksCreated.length > 0) {
              for (const link of result.linksCreated) {
                if (link.success) {
                  if (link.alreadyExists) {
                    console.log(`      🔗 Link to ${link.epic} already exists`);
                  } else {
                    console.log(`      🔗 Linked to ${link.epic}`);
                  }
                } else {
                  console.log(`      ⚠️  Failed to link to ${link.epic}: ${link.error}`);
                }
              }
            }
            console.log('');
            successCount++;
          }
        } else {
          console.error(`   ❌ Failed: ${result.error}\n`);
          failCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        failCount++;
      }
    }
  }
  
  // Summary
  console.log('==========================================');
  console.log('📊 Summary');
  console.log('==========================================');
  console.log(`✅ Created: ${successCount}`);
  console.log(`⚠️  Skipped (already exist): ${skipCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`\n🔗 View tickets at: ${JIRA_BASE_URL}/browse/${JIRA_PROJECT_KEY}`);
}

main().catch(console.error);

