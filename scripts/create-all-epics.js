import 'dotenv/config';
import fetch from 'node-fetch';

// Jira API configuration from environment variables
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

// Construct full API URL
const JIRA_API_BASE_URL = `${JIRA_BASE_URL}/rest/api/3`;
const JIRA_AUTH = `Basic ${Buffer.from(JIRA_EMAIL + ':' + JIRA_API_TOKEN).toString('base64')}`;

// Epic Issue Type ID for QA project
const EPIC_ISSUE_TYPE_ID = '10042';

// Epic definitions
const EPICS = [
  {
    summary: 'Public Pages - CatalogPage Testing',
    phase: 'Phase 2',
    priority: 'High',
    goal: 'Verify product browsing and filtering',
    stories: [
      'Test Case - CatalogPage Loads and Displays All Products',
      'Test Case - CatalogPage Product Count Displays Correctly',
      'Test Case - CatalogPage Main Category Filter Works Correctly',
      'Test Case - CatalogPage Subcategory Filter Works Correctly',
      'Test Case - CatalogPage Inventory Status Filter Works Correctly',
      'Test Case - CatalogPage Search Functionality Works Correctly',
      'Test Case - CatalogPage View Mode Switch Works Correctly',
      'Test Case - CatalogPage Navigation to Product Detail Works Correctly',
    ],
    linksToGmpEpics: ['GMP-26'],
    estimatedTime: '15-20 minutes',
  },
  {
    summary: 'Public Pages - ProductDetailPage Testing',
    phase: 'Phase 2',
    priority: 'Medium',
    goal: 'Verify product detail page functionality',
    stories: [
      'Test Case - ProductDetailPage Loads and Displays Product Information',
      'Test Case - ProductDetailPage Image Gallery Works Correctly',
      'Test Case - ProductDetailPage Breadcrumb Navigation Works Correctly',
      'Test Case - ProductDetailPage Back to Catalog Navigation Works Correctly',
    ],
    linksToGmpEpics: ['GMP-34'],
    estimatedTime: '8-10 minutes',
  },
  {
    summary: 'Admin - Authentication Testing',
    phase: 'Phase 3',
    priority: 'High',
    goal: 'Verify admin login and access control',
    stories: [
      'Test Case - Admin Login with Valid Credentials Works Correctly',
      'Test Case - Admin Login with Invalid Credentials Shows Error',
      'Test Case - Admin Login with Non-Admin User Shows Access Denied Error',
      'Test Case - Admin Login Password Visibility Toggle Works Correctly',
    ],
    linksToGmpEpics: ['GMP-10'],
    estimatedTime: '8-10 minutes',
  },
  {
    summary: 'Admin - Dashboard Testing',
    phase: 'Phase 3',
    priority: 'High',
    goal: 'Verify admin dashboard functionality',
    stories: [
      'Test Case - Admin Dashboard Loads and Displays Correctly',
      'Test Case - Admin Dashboard Product Count Displays Correctly',
      'Test Case - Admin Dashboard Sign Out Works Correctly',
      'Test Case - Admin Dashboard Unauthorized Access Redirects to Login',
    ],
    linksToGmpEpics: ['GMP-17'],
    estimatedTime: '8-10 minutes',
  },
  {
    summary: 'Admin - Product Management Testing',
    phase: 'Phase 4',
    priority: 'High',
    goal: 'Verify product CRUD operations',
    stories: [
      'Test Case - Admin Dashboard Create New Product Works Correctly',
      'Test Case - Admin Dashboard Edit Existing Product Works Correctly',
      'Test Case - Admin Dashboard Delete Product Works Correctly',
      'Test Case - Admin Dashboard Delete Product Confirmation Modal Works Correctly',
      'Test Case - Admin Dashboard Product Search Works Correctly',
      'Test Case - Admin Dashboard View Products Catalog Works Correctly',
      'Test Case - Admin Dashboard Product Form Validation Works Correctly',
    ],
    linksToGmpEpics: ['GMP-17'],
    estimatedTime: '20-25 minutes',
  },
  {
    summary: 'Admin - Sales Management Testing',
    phase: 'Phase 5',
    priority: 'Medium',
    goal: 'Verify sales management functionality',
    stories: [
      'Test Case - Admin Dashboard View Sales List Works Correctly',
      'Test Case - Admin Dashboard Search Sales by Customer Name Works Correctly',
      'Test Case - Admin Dashboard Update Sale Status to Pendiente Works Correctly',
      'Test Case - Admin Dashboard Update Sale Status to En Proceso Works Correctly',
      'Test Case - Admin Dashboard Update Sale Status to Completado Works Correctly',
      'Test Case - Admin Dashboard Update Sale Status to Cancelado Works Correctly',
    ],
    linksToGmpEpics: ['GMP-17'],
    estimatedTime: '15-20 minutes',
  },
  {
    summary: 'Admin - Activity Logs Testing',
    phase: 'Phase 5',
    priority: 'Medium',
    goal: 'Verify activity log functionality',
    stories: [
      'Test Case - Admin Dashboard View Recent Activity Works Correctly',
      'Test Case - Admin Dashboard Search Activity by Resource Name Works Correctly',
      'Test Case - Admin Dashboard Search Activity by Email Works Correctly',
      'Test Case - Admin Dashboard Filter Activity by Create Action Works Correctly',
      'Test Case - Admin Dashboard Filter Activity by Update Action Works Correctly',
      'Test Case - Admin Dashboard Filter Activity by Delete Action Works Correctly',
      'Test Case - Admin Dashboard Delete Activity Log Works Correctly',
    ],
    linksToGmpEpics: ['GMP-17'],
    estimatedTime: '15-20 minutes',
  },
  {
    summary: 'Integration Tests - Complete User Flows',
    phase: 'Phase 6',
    priority: 'Medium',
    goal: 'Verify end-to-end user flows',
    stories: [
      'Test Case - Complete Product Browsing Flow from Home to Detail',
      'Test Case - Complete Admin Product Management Flow (Create, Edit, Delete)',
      'Test Case - Complete Admin Sales Management Flow (View and Update Status)',
    ],
    linksToGmpEpics: ['GMP-4', 'GMP-26', 'GMP-34', 'GMP-17'],
    estimatedTime: '10-15 minutes',
  },
];

/**
 * Convert text to ADF format
 */
function textToADF(text) {
  if (!text || text.trim() === '') {
    return {
      type: 'doc',
      version: 1,
      content: [],
    };
  }

  // Split by lines and create paragraphs
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const content = lines.map(line => ({
    type: 'paragraph',
    content: [
      {
        type: 'text',
        text: line.trim(),
      },
    ],
  }));

  return {
    type: 'doc',
    version: 1,
    content: content.length > 0 ? content : [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    ],
  };
}

/**
 * Create description ADF for an epic
 */
function createEpicDescription(epic) {
  const lines = [
    `Epic for ${epic.goal.toLowerCase()}.`,
    '',
    `Phase: ${epic.phase}`,
    `Priority: ${epic.priority}`,
    `Estimated Execution Time: ${epic.estimatedTime}`,
    '',
    'Stories:',
    ...epic.stories.map(story => `* ${story}`),
    '',
    `Links to GMP Epics: ${epic.linksToGmpEpics.join(', ')}`,
  ];

  return textToADF(lines.join('\n'));
}

/**
 * Create an epic in Jira
 */
async function createEpic(epic) {
  const url = `${JIRA_API_BASE_URL}/issue`;
  
  const description = createEpicDescription(epic);
  
  const payload = {
    fields: {
      project: {
        key: JIRA_PROJECT_KEY,
      },
      summary: epic.summary,
      description: description,
      issuetype: {
        id: EPIC_ISSUE_TYPE_ID,
      },
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
      throw new Error(`Failed to create epic: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      key: data.key,
      id: data.id,
      self: data.self,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Creating All QA Epics');
  console.log('========================\n');
  console.log(`Epics to create: ${EPICS.length}\n`);

  const results = {
    success: [],
    failed: [],
  };

  for (const epic of EPICS) {
    console.log(`📋 Creating: ${epic.summary}...`);
    const result = await createEpic(epic);
    
    if (result.success) {
      console.log(`   ✅ Created: ${result.key} - ${epic.summary}`);
      console.log(`   🔗 ${result.self}`);
      results.success.push({
        key: result.key,
        summary: epic.summary,
      });
    } else {
      console.error(`   ❌ Failed: ${result.error}`);
      results.failed.push({
        summary: epic.summary,
        error: result.error,
      });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successfully created: ${results.success.length} epics`);
  if (results.success.length > 0) {
    console.log('\nCreated Epics:');
    results.success.forEach(epic => {
      console.log(`   • ${epic.key}: ${epic.summary}`);
    });
  }
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed to create: ${results.failed.length} epics`);
    results.failed.forEach(epic => {
      console.log(`   • ${epic.summary}: ${epic.error}`);
    });
  }

  console.log(`\n🔗 View epics at: ${JIRA_BASE_URL}/browse/${JIRA_PROJECT_KEY}`);
  console.log(`\n📋 Next Steps:`);
  console.log(`   1. Review created epics in Jira`);
  console.log(`   2. Create stories under each epic`);
  console.log(`   3. Link stories to GMP feature epics`);
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

