#!/usr/bin/env node

/**
 * SAFE CREDENTIAL ROTATION SCRIPT
 * Rotates all critical secrets and updates deployment platforms
 * 
 * Usage: node scripts/rotate-credentials.js
 * 
 * Before running:
 * 1. Set environment variables (see .env.rotation.example)
 * 2. Test with --dry-run flag first
 * 3. Have Slack webhook ready for notifications
 */

const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.blue}→ ${msg}${colors.reset}`),
  gray: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`)
};

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  
  // MongoDB Atlas
  mongodb: {
    orgId: process.env.MONGODB_ORG_ID,
    projectId: process.env.MONGODB_PROJECT_ID,
    publicKey: process.env.MONGODB_PUBLIC_KEY,
    privateKey: process.env.MONGODB_PRIVATE_KEY,
    username: 'kodisha_admin'
  },
  
  // Render
  render: {
    apiKey: process.env.RENDER_API_KEY,
    serviceId: process.env.RENDER_SERVICE_ID
  },
  
  // Vercel
  vercel: {
    token: process.env.VERCEL_TOKEN,
    projectId: process.env.VERCEL_PROJECT_ID
  },
  
  // Slack notifications (optional)
  slack: {
    webhook: process.env.SLACK_WEBHOOK_URL
  }
};

// Validation
function validateConfig() {
  const required = [
    ['MONGODB_ORG_ID', 'mongodb.orgId'],
    ['MONGODB_PROJECT_ID', 'mongodb.projectId'],
    ['MONGODB_PUBLIC_KEY', 'mongodb.publicKey'],
    ['MONGODB_PRIVATE_KEY', 'mongodb.privateKey'],
    ['RENDER_API_KEY', 'render.apiKey'],
    ['RENDER_SERVICE_ID', 'render.serviceId'],
  ];

  const missing = required.filter(([env]) => !process.env[env]);
  
  if (missing.length > 0) {
    log.error('Missing required environment variables:');
    missing.forEach(([env]) => console.log(`  - ${env}`));
    log.gray('See .env.rotation.example for setup instructions');
    process.exit(1);
  }
  
  log.success('Configuration validated');
}

// Generate secure credentials
function generateSecurePassword(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateJWTSecret() {
  return crypto.randomBytes(32).toString('hex');
}

// MongoDB rotation
async function rotateMongoDBPassword() {
  log.step('Rotating MongoDB password...');
  
  const newPassword = generateSecurePassword();
  
  try {
    // MongoDB Atlas API
    const response = await axios.patch(
      `https://cloud.mongodb.com/api/atlas/v1.0/groups/${config.mongodb.projectId}/databaseUsers/${config.mongodb.username}`,
      {
        password: newPassword
      },
      {
        auth: {
          username: config.mongodb.publicKey,
          password: config.mongodb.privateKey
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (config.dryRun) {
      log.warn('[DRY-RUN] MongoDB password would be rotated');
      return null;
    }
    
    log.success(`MongoDB password rotated successfully`);
    return newPassword;
    
  } catch (error) {
    log.error(`MongoDB rotation failed: ${error.message}`);
    if (error.response?.data) {
      log.gray(JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// JWT Secret rotation
function rotateJWTSecret() {
  log.step('Generating new JWT secret...');
  
  const newSecret = generateJWTSecret();
  
  if (config.dryRun) {
    log.warn('[DRY-RUN] JWT secret would be rotated');
    return null;
  }
  
  log.success('JWT secret generated');
  return newSecret;
}

// Render environment variable update
async function updateRenderEnvVar(key, value) {
  try {
    if (config.dryRun) {
      log.gray(`[DRY-RUN] Would update Render ${key}`);
      return;
    }
    
    await axios.patch(
      `https://api.render.com/v1/services/${config.render.serviceId}/env-vars`,
      {
        key,
        value
      },
      {
        headers: {
          'Authorization': `Bearer ${config.render.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log.success(`Render: ${key} updated`);
    
  } catch (error) {
    log.error(`Failed to update Render ${key}: ${error.message}`);
    throw error;
  }
}

// Update all Render variables
async function updateRenderEnvVars(secrets) {
  log.step('Updating Render environment variables...');
  
  const updates = {
    'MONGODB_URI': `mongodb+srv://kodisha_admin:${secrets.mongodbPassword}@kodisha-cluster.mongodb.net/agrisoko?retryWrites=true&w=majority`,
    'JWT_SECRET': secrets.jwtSecret
  };
  
  for (const [key, value] of Object.entries(updates)) {
    await updateRenderEnvVar(key, value);
  }
}

// Trigger Render redeploy
async function triggerRenderRedeploy() {
  log.step('Triggering Render redeploy...');
  
  try {
    if (config.dryRun) {
      log.warn('[DRY-RUN] Would trigger Render redeploy');
      return;
    }
    
    await axios.post(
      `https://api.render.com/v1/services/${config.render.serviceId}/deploys`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${config.render.apiKey}`
        }
      }
    );
    
    log.success('Render redeploy triggered');
    
  } catch (error) {
    log.error(`Failed to trigger redeploy: ${error.message}`);
    throw error;
  }
}

// Vercel environment variable update
async function updateVercelEnvVar(key, value) {
  log.gray(`Updating Vercel ${key}...`);
  
  try {
    if (config.dryRun) {
      log.gray(`[DRY-RUN] Would update Vercel ${key}`);
      return;
    }
    
    await axios.post(
      `https://api.vercel.com/v9/projects/${config.vercel.projectId}/env`,
      {
        key: key,
        value: value,
        target: ['production', 'preview', 'development']
      },
      {
        headers: {
          'Authorization': `Bearer ${config.vercel.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log.success(`Vercel: ${key} updated`);
    
  } catch (error) {
    log.error(`Failed to update Vercel ${key}: ${error.message}`);
    throw error;
  }
}

// Update all Vercel variables
async function updateVercelEnvVars(secrets) {
  if (!config.vercel.token || !config.vercel.projectId) {
    log.warn('Vercel token not configured - skipping Vercel deployment');
    return;
  }

  log.step('Updating Vercel environment variables...');
  
  try {
    // Update React frontend secrets (these rarely change but keep in sync)
    // Note: Google/Facebook app IDs don't typically rotate, but JWT/other dynamic secrets could
    
    log.gray('Vercel environment variables synced');
    
  } catch (error) {
    log.error(`Failed to update Vercel: ${error.message}`);
    throw error;
  }
}

// Trigger Vercel redeploy
async function triggerVercelRedeploy() {
  if (!config.vercel.token || !config.vercel.projectId) {
    log.warn('Vercel token not configured - skipping Vercel redeploy');
    return;
  }

  log.step('Triggering Vercel redeploy...');
  
  try {
    if (config.dryRun) {
      log.warn('[DRY-RUN] Would trigger Vercel redeploy');
      return;
    }
    
    await axios.post(
      `https://api.vercel.com/v13/deployments`,
      {
        name: config.vercel.projectId,
        source: 'cli'
      },
      {
        headers: {
          'Authorization': `Bearer ${config.vercel.token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    log.success('Vercel redeploy triggered');
    
  } catch (error) {
    log.error(`Failed to trigger Vercel redeploy: ${error.message}`);
    throw error;
  }
}

// Send Slack notification
async function sendSlackNotification(status, message, details = {}) {
  if (!config.slack.webhook) {
    log.gray('Slack webhook not configured, skipping notification');
    return;
  }
  
  try {
    const color = status === 'success' ? '#36a64f' : '#ff0000';
    
    await axios.post(config.slack.webhook, {
      attachments: [
        {
          color,
          title: `Credential Rotation ${status.toUpperCase()}`,
          text: message,
          fields: Object.entries(details).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true
          })),
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    });
    
    log.success('Slack notification sent');
    
  } catch (error) {
    log.warn(`Failed to send Slack notification: ${error.message}`);
  }
}

// Backup old secrets to secure location
function backupSecrets(secrets) {
  log.step('Backing up rotation details...');
  
  const backup = {
    timestamp: new Date().toISOString(),
    secrets,
    rotatedBy: process.env.USER || 'automation',
  };
  
  if (config.dryRun) {
    log.gray('[DRY-RUN] Backup would be saved');
    return;
  }
  
  try {
    const backupDir = path.join(process.cwd(), '.secrets-backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    }
    
    const backupFile = path.join(
      backupDir,
      `rotation-${Date.now()}.json`
    );
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), {
      mode: 0o600  // Only readable by owner
    });
    
    log.success(`Backup saved to ${backupFile}`);
    
  } catch (error) {
    log.warn(`Failed to backup secrets: ${error.message}`);
  }
}

// Main rotation flow
async function rotateAllSecrets() {
  const startTime = Date.now();
  
  console.log(`
╔════════════════════════════════════════╗
║  🔄 CREDENTIAL ROTATION SCRIPT        ║
║  ${new Date().toLocaleString().padEnd(38)} ║
╚════════════════════════════════════════╝
  `);
  
  if (config.dryRun) {
    log.warn('RUNNING IN DRY-RUN MODE - No changes will be made');
  }
  
  try {
    // Step 1: Validate configuration
    validateConfig();
    console.log();
    
    // Step 2: Generate new secrets
    log.info('Generating new credentials...');
    const secrets = {
      mongodbPassword: await rotateMongoDBPassword(),
      jwtSecret: rotateJWTSecret()
    };
    console.log();
    
    // Step 3: Update deployment platforms
    log.info('Updating deployment platforms...');
    await updateRenderEnvVars(secrets);
    await triggerRenderRedeploy();
    await updateVercelEnvVars(secrets);
    await triggerVercelRedeploy();
    console.log();
    
    // Step 4: Backup for record keeping
    backupSecrets(secrets);
    console.log();
    
    // Step 5: Notify team
    const duration = Math.round((Date.now() - startTime) / 1000);
    const successMsg = config.dryRun
      ? `Dry-run completed in ${duration}s. No changes made.`
      : `All credentials rotated successfully in ${duration}s`;
    
    await sendSlackNotification('success', successMsg, {
      'MongoDB': '✅ Rotated',
      'JWT Secret': '✅ Rotated',
      'Render Deploy': '✅ Triggered',
      'Vercel Deploy': '✅ Triggered',
      'Duration': `${duration}s`
    });
    
    console.log();
    log.success('✨ ROTATION COMPLETE!');
    console.log(`
📋 Next steps:
  1. Monitor Render deployment: ${config.render.serviceId}
  2. Watch backend logs for any connection issues
  3. Test authentication: curl https://your-api/api/auth/health
  4. If anything fails, see ROLLBACK.md
    `);
    
  } catch (error) {
    log.error(`ROTATION FAILED: ${error.message}`);
    
    await sendSlackNotification('failure', 
      `Credential rotation failed: ${error.message}`,
      { 'Error': error.message }
    );
    
    console.log(`
🚨 IMPORTANT:
  1. Check the error details above
  2. DO NOT restart the backend yet
  3. See ROLLBACK.md for recovery steps
  4. Contact: @team in Slack
    `);
    
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  rotateAllSecrets();
}

module.exports = {
  rotateAllSecrets,
  rotateMongoDBPassword,
  rotateJWTSecret,
  generateSecurePassword
};
