import 'dotenv/config';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// Jira API configuration from environment variables
const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_USER_ACCOUNT_ID = process.env.JIRA_USER_ACCOUNT_ID;

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
if (!JIRA_USER_ACCOUNT_ID) {
  console.error('❌ Error: JIRA_USER_ACCOUNT_ID environment variable is required');
  process.exit(1);
}

// Construct full API URL
const JIRA_API_BASE_URL = `${JIRA_BASE_URL}/rest/api/3`;
const JIRA_AUTH = `Basic ${Buffer.from(JIRA_EMAIL + ':' + JIRA_API_TOKEN).toString('base64')}`;

// Tickets to update (completed Phase 1 tests)
const COMPLETED_TICKETS = [
  'QA-5',  // Smoke Test - Critical Public Paths
  'QA-6',  // Smoke Test - Critical Admin Paths
  'QA-7',  // Smoke Test - Critical Navigation
  'QA-8',  // HomePage Loads and Displays
  'QA-9',  // HomePage Hero Section
  'QA-10', // HomePage Navigation to Catalog
];

/**
 * Get available transitions for a ticket
 */
async function getTransitions(issueKey) {
  const url = `${JIRA_API_BASE_URL}/issue/${issueKey}/transitions`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': JIRA_AUTH,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get transitions: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.transitions || [];
  } catch (error) {
    console.error(`Error getting transitions for ${issueKey}:`, error.message);
    return [];
  }
}

/**
 * Find "Done" transition ID
 */
function findDoneTransition(transitions) {
  // Try to find "Done" transition (case-insensitive)
  const doneTransition = transitions.find(t => 
    t.name.toLowerCase() === 'done' || 
    t.to.name.toLowerCase() === 'done'
  );
  
  if (doneTransition) {
    return doneTransition.id;
  }

  // Try to find "Closed" or "Resolved" as fallback
  const closedTransition = transitions.find(t => 
    t.to.name.toLowerCase() === 'closed' || 
    t.to.name.toLowerCase() === 'resolved'
  );
  
  if (closedTransition) {
    return closedTransition.id;
  }

  // Return first available transition if no "Done" found
  if (transitions.length > 0) {
    console.warn(`⚠️  No "Done" transition found, using: ${transitions[0].to.name}`);
    return transitions[0].id;
  }

  return null;
}

/**
 * Update ticket status to Done
 */
async function updateStatus(issueKey, transitionId) {
  const url = `${JIRA_API_BASE_URL}/issue/${issueKey}/transitions`;
  
  const payload = {
    transition: {
      id: transitionId,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': JIRA_AUTH,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update status: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error updating status for ${issueKey}:`, error.message);
    return false;
  }
}

/**
 * Assign ticket to user
 */
async function assignTicket(issueKey, accountId) {
  const url = `${JIRA_API_BASE_URL}/issue/${issueKey}`;
  
  const payload = {
    fields: {
      assignee: {
        accountId: accountId,
      },
    },
  };

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': JIRA_AUTH,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to assign ticket: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error assigning ${issueKey}:`, error.message);
    return false;
  }
}

/**
 * Update a single ticket (status + assignee)
 */
async function updateTicket(issueKey) {
  console.log(`\n📋 Processing ${issueKey}...`);

  // Step 1: Get available transitions
  console.log(`   Getting available transitions...`);
  const transitions = await getTransitions(issueKey);
  
  if (transitions.length === 0) {
    console.error(`   ❌ No transitions available for ${issueKey}`);
    return false;
  }

  // Step 2: Find "Done" transition
  const transitionId = findDoneTransition(transitions);
  if (!transitionId) {
    console.error(`   ❌ No valid transition found for ${issueKey}`);
    return false;
  }

  // Step 3: Update status
  console.log(`   Updating status to "Done"...`);
  const statusUpdated = await updateStatus(issueKey, transitionId);
  if (!statusUpdated) {
    console.error(`   ❌ Failed to update status for ${issueKey}`);
    return false;
  }
  console.log(`   ✅ Status updated to "Done"`);

  // Step 4: Assign ticket
  console.log(`   Assigning ticket to user...`);
  const assigned = await assignTicket(issueKey, JIRA_USER_ACCOUNT_ID);
  if (!assigned) {
    console.warn(`   ⚠️  Failed to assign ${issueKey} (status was updated)`);
    return statusUpdated; // Status update succeeded even if assignment failed
  }
  console.log(`   ✅ Ticket assigned`);

  return true;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Updating Jira Tickets to "Done" Status');
  console.log('==========================================\n');
  console.log(`Tickets to update: ${COMPLETED_TICKETS.join(', ')}\n`);

  const results = {
    success: [],
    failed: [],
  };

  for (const ticketKey of COMPLETED_TICKETS) {
    const success = await updateTicket(ticketKey);
    if (success) {
      results.success.push(ticketKey);
    } else {
      results.failed.push(ticketKey);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary');
  console.log('='.repeat(50));
  console.log(`✅ Successfully updated: ${results.success.length} tickets`);
  if (results.success.length > 0) {
    console.log(`   ${results.success.join(', ')}`);
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed to update: ${results.failed.length} tickets`);
    console.log(`   ${results.failed.join(', ')}`);
  }

  console.log(`\n🔗 View tickets at: ${JIRA_BASE_URL}/browse/QA`);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

