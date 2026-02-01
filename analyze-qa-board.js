#!/usr/bin/env node
/**
 * Analyze all tickets in QA board to check for duplicates and verify structure
 */

import 'dotenv/config';
import fetch from 'node-fetch';

// Jira configuration from environment variables
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

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

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Check tickets from QA-2 to QA-30
const TICKETS_TO_CHECK = [];
for (let i = 2; i <= 30; i++) {
  TICKETS_TO_CHECK.push(`QA-${i}`);
}

async function getTicket(key) {
  try {
    const url = `${JIRA_BASE_URL}/rest/api/3/issue/${key}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      return await response.json();
    } else if (response.status === 404) {
      return null; // Ticket doesn't exist
    } else {
      return { error: `Status ${response.status}` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function main() {
  console.log('🔍 Analyzing QA Board - All Tickets');
  console.log('=====================================\n');
  
  const results = {
    epics: [],
    stories: [],
    tasks: [],
    bugs: [],
    notFound: [],
    errors: []
  };
  
  for (const key of TICKETS_TO_CHECK) {
    const ticket = await getTicket(key);
    
    if (!ticket) {
      results.notFound.push(key);
      continue;
    }
    
    if (ticket.error) {
      results.errors.push({ key, error: ticket.error });
      continue;
    }
    
    const issueType = ticket.fields.issuetype.name;
    const summary = ticket.fields.summary;
    const parent = ticket.fields.parent?.key || 'None';
    const links = ticket.fields.issuelinks || [];
    const relatesTo = links
      .filter(link => link.type.name === 'Relates')
      .map(link => link.outwardIssue?.key || link.inwardIssue?.key)
      .filter(Boolean);
    
    const ticketInfo = {
      key,
      summary,
      issueType,
      parent,
      relatesTo,
      status: ticket.fields.status.name,
      created: ticket.fields.created
    };
    
    switch (issueType) {
      case 'Epic':
        results.epics.push(ticketInfo);
        break;
      case 'Story':
        results.stories.push(ticketInfo);
        break;
      case 'Task':
        results.tasks.push(ticketInfo);
        break;
      case 'Bug':
        results.bugs.push(ticketInfo);
        break;
      default:
        results.stories.push(ticketInfo); // Default to stories
    }
  }
  
  // Print Results
  console.log('📊 EPICS:');
  console.log('==========');
  if (results.epics.length === 0) {
    console.log('  None found\n');
  } else {
    results.epics.forEach(epic => {
      console.log(`  ${epic.key}: ${epic.summary}`);
      console.log(`    Status: ${epic.status}`);
      console.log(`    Created: ${epic.created}`);
      if (epic.relatesTo.length > 0) {
        console.log(`    Relates to: ${epic.relatesTo.join(', ')}`);
      }
      console.log('');
    });
  }
  
  console.log('📋 STORIES:');
  console.log('===========');
  if (results.stories.length === 0) {
    console.log('  None found\n');
  } else {
    results.stories.forEach(story => {
      console.log(`  ${story.key}: ${story.summary}`);
      console.log(`    Type: ${story.issueType}`);
      console.log(`    Parent Epic: ${story.parent}`);
      console.log(`    Status: ${story.status}`);
      if (story.relatesTo.length > 0) {
        console.log(`    Relates to: ${story.relatesTo.join(', ')}`);
      }
      console.log('');
    });
  }
  
  console.log('📝 TASKS:');
  console.log('==========');
  if (results.tasks.length === 0) {
    console.log('  None found\n');
  } else {
    results.tasks.forEach(task => {
      console.log(`  ${task.key}: ${task.summary}`);
      console.log(`    Parent: ${task.parent}`);
      console.log(`    Status: ${task.status}`);
      console.log('');
    });
  }
  
  console.log('🐛 BUGS:');
  console.log('=========');
  if (results.bugs.length === 0) {
    console.log('  None found\n');
  } else {
    results.bugs.forEach(bug => {
      console.log(`  ${bug.key}: ${bug.summary}`);
      console.log(`    Status: ${bug.status}`);
      console.log('');
    });
  }
  
  // Check for duplicates
  console.log('🔍 DUPLICATE CHECK:');
  console.log('===================');
  const summaries = {};
  [...results.epics, ...results.stories, ...results.tasks, ...results.bugs].forEach(ticket => {
    const key = ticket.summary.toLowerCase();
    if (!summaries[key]) {
      summaries[key] = [];
    }
    summaries[key].push(ticket.key);
  });
  
  const duplicates = Object.entries(summaries).filter(([_, keys]) => keys.length > 1);
  if (duplicates.length === 0) {
    console.log('  ✅ No duplicates found\n');
  } else {
    console.log('  ⚠️  Potential duplicates found:\n');
    duplicates.forEach(([summary, keys]) => {
      console.log(`    "${summary}":`);
      keys.forEach(key => console.log(`      - ${key}`));
      console.log('');
    });
  }
  
  // Summary
  console.log('=====================================');
  console.log('📊 SUMMARY');
  console.log('=====================================');
  console.log(`Epics: ${results.epics.length}`);
  console.log(`Stories: ${results.stories.length}`);
  console.log(`Tasks: ${results.tasks.length}`);
  console.log(`Bugs: ${results.bugs.length}`);
  console.log(`Not Found: ${results.notFound.length} (${results.notFound.join(', ')})`);
  if (results.errors.length > 0) {
    console.log(`Errors: ${results.errors.length}`);
    results.errors.forEach(({ key, error }) => {
      console.log(`  ${key}: ${error}`);
    });
  }
  console.log(`Total Found: ${results.epics.length + results.stories.length + results.tasks.length + results.bugs.length}`);
}

main().catch(console.error);

