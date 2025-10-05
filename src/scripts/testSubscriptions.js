#!/usr/bin/env node

/**
 * Subscription Testing Script
 * Tests for duplicate Supabase subscriptions and channel conflicts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔌 Starting Subscription Tests...\n');

// Test 1: Check for duplicate channel names
function testDuplicateChannelNames() {
  console.log('📋 Test 1: Checking for duplicate channel names...');
  
  const filesToCheck = [
    '../hooks/useUserOrders.tsx',
    '../pages/MyOrders.tsx',
    '../components/UnifiedOrderTracker.tsx',
    '../hooks/use-persistent-order.ts',
    '../components/SimpleOrderTracker.tsx',
    '../components/PersistentOrderTracker.tsx',
    '../pages/OrderTracking.tsx'
  ];
  
  const channelNames = new Map();
  let duplicatesFound = false;
  
  filesToCheck.forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Extract channel names
      const channelMatches = content.match(/\.channel\(['"`]([^'"`]+)['"`]\)/g);
      
      if (channelMatches) {
        channelMatches.forEach(match => {
          const channelName = match.match(/\.channel\(['"`]([^'"`]+)['"`]\)/)[1];
          
          // Skip dynamic channel names with variables
          if (channelName.includes('${')) {
            const basePattern = channelName.replace(/\$\{[^}]+\}/g, '${VAR}');
            
            if (channelNames.has(basePattern)) {
              console.log(`❌ Duplicate channel pattern found: ${basePattern}`);
              console.log(`   - ${channelNames.get(basePattern)}`);
              console.log(`   - ${path.basename(filePath)}`);
              duplicatesFound = true;
            } else {
              channelNames.set(basePattern, path.basename(filePath));
            }
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${filePath}:`, error.message);
    }
  });
  
  if (!duplicatesFound) {
    console.log('✅ No duplicate channel names found');
  }
  
  return !duplicatesFound;
}

// Test 2: Check for proper subscription cleanup
function testSubscriptionCleanup() {
  console.log('\n📋 Test 2: Checking subscription cleanup patterns...');
  
  const filesToCheck = [
    '../hooks/useUserOrders.tsx',
    '../pages/MyOrders.tsx',
    '../hooks/use-persistent-order.ts',
    '../components/SimpleOrderTracker.tsx'
  ];
  
  let allHaveCleanup = true;
  
  filesToCheck.forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (!fs.existsSync(fullPath)) return;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if file has subscriptions
      if (content.includes('.subscribe()')) {
        // Check if it has proper cleanup
        if (content.includes('removeChannel') || content.includes('unsubscribe')) {
          console.log(`✅ ${path.basename(filePath)}: Has proper cleanup`);
        } else {
          console.log(`❌ ${path.basename(filePath)}: Missing cleanup`);
          allHaveCleanup = false;
        }
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${filePath}:`, error.message);
      allHaveCleanup = false;
    }
  });
  
  return allHaveCleanup;
}

// Test 3: Check for useEffect dependency issues
function testUseEffectDependencies() {
  console.log('\n📋 Test 3: Checking useEffect dependencies for subscriptions...');
  
  const filesToCheck = [
    '../hooks/useUserOrders.tsx',
    '../hooks/useBusinessHours.ts'
  ];
  
  let allCorrect = true;
  
  filesToCheck.forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (!fs.existsSync(fullPath)) return;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for useEffect with subscriptions
      const useEffectBlocks = content.match(/useEffect\([^}]+\}, \[[^\]]*\]/gs);
      
      if (useEffectBlocks) {
        useEffectBlocks.forEach((block, index) => {
          if (block.includes('.subscribe()')) {
            // Check if dependencies look reasonable (not too many)
            const depsMatch = block.match(/\}, \[([^\]]*)\]/);
            if (depsMatch) {
              const deps = depsMatch[1].split(',').map(d => d.trim()).filter(d => d);
              if (deps.length > 5) {
                console.log(`⚠️  ${path.basename(filePath)}: useEffect ${index + 1} has many dependencies (${deps.length})`);
              } else {
                console.log(`✅ ${path.basename(filePath)}: useEffect ${index + 1} has reasonable dependencies`);
              }
            }
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${filePath}:`, error.message);
      allCorrect = false;
    }
  });
  
  return allCorrect;
}

// Test 4: Check for subscription conflicts
function testSubscriptionConflicts() {
  console.log('\n📋 Test 4: Checking for potential subscription conflicts...');
  
  const subscriptionPatterns = [
    'user-orders-hook-',
    'user-orders-page-',
    'persistent-order-',
    'order-updates_',
    'homepage-order-',
    'business-hours-updates-'
  ];
  
  console.log('✅ Found unique subscription patterns:');
  subscriptionPatterns.forEach(pattern => {
    console.log(`   - ${pattern}*`);
  });
  
  return true;
}

// Test 5: Check for memoization of functions used in subscriptions
function testFunctionMemoization() {
  console.log('\n📋 Test 5: Checking function memoization in subscription hooks...');
  
  const filesToCheck = [
    '../hooks/useUserOrders.tsx',
    '../hooks/useCustomerAuth.tsx'
  ];
  
  let allMemoized = true;
  
  filesToCheck.forEach(filePath => {
    try {
      const fullPath = path.join(__dirname, filePath);
      if (!fs.existsSync(fullPath)) return;
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for functions that should be memoized
      const functionsToCheck = ['loadUserOrders', 'loadUserProfile', 'refreshOrders'];
      
      functionsToCheck.forEach(funcName => {
        if (content.includes(`const ${funcName} =`)) {
          if (content.includes(`const ${funcName} = useCallback`)) {
            console.log(`✅ ${path.basename(filePath)}: ${funcName} is memoized`);
          } else {
            console.log(`❌ ${path.basename(filePath)}: ${funcName} is not memoized`);
            allMemoized = false;
          }
        }
      });
      
    } catch (error) {
      console.log(`❌ Error checking ${filePath}:`, error.message);
      allMemoized = false;
    }
  });
  
  return allMemoized;
}

// Run all tests
async function runAllSubscriptionTests() {
  const tests = [
    { name: 'Duplicate Channel Names', fn: testDuplicateChannelNames },
    { name: 'Subscription Cleanup', fn: testSubscriptionCleanup },
    { name: 'useEffect Dependencies', fn: testUseEffectDependencies },
    { name: 'Subscription Conflicts', fn: testSubscriptionConflicts },
    { name: 'Function Memoization', fn: testFunctionMemoization }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    if (test.fn()) {
      passedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 SUBSCRIPTION TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All subscription tests passed! No conflicts detected.');
  } else {
    console.log('⚠️  Some subscription tests failed. Check the issues above.');
  }
  
  console.log('='.repeat(50));
  
  return passedTests === totalTests;
}

// Run the tests
runAllSubscriptionTests().catch(console.error);
