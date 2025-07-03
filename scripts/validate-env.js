#!/usr/bin/env node

/**
 * Environment Validation Script for eGarden
 * Validates that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Required environment variables
const requiredVars = [
  {
    name: 'EXPO_PUBLIC_FIREBASE_API_KEY',
    description: 'Firebase API Key',
    critical: true
  },
  {
    name: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    description: 'Firebase Project ID',
    critical: true
  },
  {
    name: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    description: 'Firebase Auth Domain',
    critical: true
  },
  {
    name: 'EXPO_PUBLIC_FIREBASE_DATABASE_URL',
    description: 'Firebase Database URL',
    critical: true
  },
  {
    name: 'OPENWEATHER_API_KEY',
    description: 'OpenWeather API Key',
    critical: false
  },
  {
    name: 'PLANTNET_API_KEY',
    description: 'PlantNet API Key',
    critical: false
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API Key',
    critical: false
  },
  {
    name: 'STRIPE_PUBLISHABLE_KEY',
    description: 'Stripe Publishable Key',
    critical: false
  }
];

// Optional environment variables
const optionalVars = [
  'EAS_PROJECT_ID',
  'SENTRY_ORG',
  'SENTRY_PROJECT',
  'EXPO_PUBLIC_LOCAL_AI_ENDPOINT'
];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  log('\n📋 Environment File Check', 'bold');
  log('=' .repeat(50), 'blue');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', 'red');
    
    if (fs.existsSync(envExamplePath)) {
      log('💡 Found .env.example file. Copy it to .env and fill in your values:', 'yellow');
      log('   cp .env.example .env', 'blue');
    } else {
      log('❌ .env.example file also not found!', 'red');
    }
    
    return false;
  }
  
  log('✅ .env file found', 'green');
  return true;
}

function loadEnvironment() {
  try {
    // Load .env file manually (simple parsing)
    const envPath = path.join(process.cwd(), '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  } catch (error) {
    log(`❌ Error loading .env file: ${error.message}`, 'red');
    return false;
  }
  
  return true;
}

function validateEnvironmentVariables() {
  log('\n🔧 Environment Variables Check', 'bold');
  log('=' .repeat(50), 'blue');
  
  let criticalMissing = 0;
  let optionalMissing = 0;
  
  // Check required variables
  requiredVars.forEach(variable => {
    const value = process.env[variable.name];
    const hasValue = value && value.trim() !== '' && !value.includes('your_') && !value.includes('_here');
    
    if (hasValue) {
      log(`✅ ${variable.name} - ${variable.description}`, 'green');
    } else {
      const severity = variable.critical ? 'red' : 'yellow';
      const icon = variable.critical ? '❌' : '⚠️ ';
      log(`${icon} ${variable.name} - ${variable.description} (${variable.critical ? 'CRITICAL' : 'optional'})`, severity);
      
      if (variable.critical) {
        criticalMissing++;
      } else {
        optionalMissing++;
      }
    }
  });
  
  // Check optional variables
  log('\n🔧 Optional Configuration', 'bold');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    const hasValue = value && value.trim() !== '' && !value.includes('your_');
    
    if (hasValue) {
      log(`✅ ${varName}`, 'green');
    } else {
      log(`⚠️  ${varName} (optional)`, 'yellow');
    }
  });
  
  return { criticalMissing, optionalMissing };
}

function checkFirebaseConfig() {
  log('\n🔥 Firebase Configuration Check', 'bold');
  log('=' .repeat(50), 'blue');
  
  const firebaseVars = [
    'EXPO_PUBLIC_FIREBASE_API_KEY',
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'EXPO_PUBLIC_FIREBASE_DATABASE_URL'
  ];
  
  const missingFirebase = firebaseVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.includes('your_') || value.includes('_here');
  });
  
  if (missingFirebase.length === 0) {
    log('✅ Firebase configuration appears complete', 'green');
    log('💡 Remember to:', 'blue');
    log('   - Enable Authentication in Firebase Console', 'blue');
    log('   - Set up Realtime Database', 'blue');
    log('   - Configure Storage rules', 'blue');
  } else {
    log('❌ Firebase configuration incomplete', 'red');
    log('📖 Setup guide:', 'blue');
    log('   1. Go to https://console.firebase.google.com/', 'blue');
    log('   2. Create a new project or select existing', 'blue');
    log('   3. Get configuration from Project Settings', 'blue');
    log('   4. Update your .env file with the values', 'blue');
  }
  
  return missingFirebase.length === 0;
}

function checkDependencies() {
  log('\n📦 Dependencies Check', 'bold');
  log('=' .repeat(50), 'blue');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json not found', 'red');
    return false;
  }
  
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log('❌ node_modules not found. Run: npm install', 'red');
    return false;
  }
  
  log('✅ Dependencies appear to be installed', 'green');
  return true;
}

function generateSummaryReport(envExists, criticalMissing, optionalMissing, firebaseComplete, depsInstalled) {
  log('\n📊 Validation Summary', 'bold');
  log('=' .repeat(50), 'blue');
  
  const status = criticalMissing === 0 && envExists && firebaseComplete && depsInstalled ? 'READY' : 'NEEDS SETUP';
  const statusColor = status === 'READY' ? 'green' : 'yellow';
  
  log(`Status: ${status}`, statusColor);
  log(`Environment file: ${envExists ? '✅' : '❌'}`);
  log(`Dependencies: ${depsInstalled ? '✅' : '❌'}`);
  log(`Critical config: ${criticalMissing === 0 ? '✅' : `❌ ${criticalMissing} missing`}`);
  log(`Optional config: ${optionalMissing === 0 ? '✅' : `⚠️  ${optionalMissing} missing`}`);
  log(`Firebase setup: ${firebaseComplete ? '✅' : '❌'}`);
  
  if (status === 'READY') {
    log('\n🚀 Ready to start development!', 'green');
    log('Run: npm run dev', 'blue');
  } else {
    log('\n⚠️  Setup required before development', 'yellow');
    log('See SETUP.md for detailed instructions', 'blue');
  }
}

// Main execution
function main() {
  log('🌱 eGarden Environment Validation', 'bold');
  log('Checking development environment setup...\n', 'blue');
  
  const envExists = checkEnvFile();
  let criticalMissing = 0;
  let optionalMissing = 0;
  let firebaseComplete = false;
  
  if (envExists) {
    if (loadEnvironment()) {
      const result = validateEnvironmentVariables();
      criticalMissing = result.criticalMissing;
      optionalMissing = result.optionalMissing;
      firebaseComplete = checkFirebaseConfig();
    }
  }
  
  const depsInstalled = checkDependencies();
  
  generateSummaryReport(envExists, criticalMissing, optionalMissing, firebaseComplete, depsInstalled);
  
  // Exit with error code if critical issues found
  const hasErrors = !envExists || criticalMissing > 0 || !depsInstalled;
  process.exit(hasErrors ? 1 : 0);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, validateEnvironmentVariables };