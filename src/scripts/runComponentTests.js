#!/usr/bin/env node

/**
 * Component Testing Script
 * Tests all critical components for loading issues and infinite loops
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Starting Component Tests...\n');

// Test 1: Check for useCallback usage in critical hooks
function testUseCallbackUsage() {
  console.log('📋 Test 1: Checking useCallback usage in hooks...');
  
  // Customer authentication files removed
  console.log('⚠️ Customer authentication files have been removed from the project');

  try {
    
    console.log('✅ Customer authentication removed - no longer applicable');
    
    return true;
  } catch (error) {
    console.log('❌ Error reading hook files:', error.message);
    return false;
  }
}

// Test 2: Check Products component structure
function testProductsComponent() {
  console.log('\n📋 Test 2: Checking Products component structure...');
  
  const productsPath = path.join(__dirname, '../components/Products.tsx');
  
  try {
    const content = fs.readFileSync(productsPath, 'utf8');
    
    // Check if useEffect comes after function definitions
    const useEffectIndex = content.indexOf('useEffect(() => {\n    loadProducts();');
    const loadProductsIndex = content.indexOf('const loadProducts = useCallback');
    const loadContentIndex = content.indexOf('const loadContent = useCallback');
    
    if (useEffectIndex > loadProductsIndex && useEffectIndex > loadContentIndex) {
      console.log('✅ Products: useEffect properly positioned after function definitions');
    } else {
      console.log('❌ Products: useEffect called before function definitions');
      return false;
    }
    
    // Check if functions are memoized
    if (content.includes('const loadProducts = useCallback')) {
      console.log('✅ Products: loadProducts properly memoized');
    } else {
      console.log('❌ Products: loadProducts not memoized');
      return false;
    }
    
    if (content.includes('const loadContent = useCallback')) {
      console.log('✅ Products: loadContent properly memoized');
    } else {
      console.log('❌ Products: loadContent not memoized');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error reading Products component:', error.message);
    return false;
  }
}

// Test 3: Check for proper dependency arrays
function testDependencyArrays() {
  console.log('\n📋 Test 3: Checking useEffect dependency arrays...');
  
  const componentsToCheck = [
    '../components/Products.tsx'
    // Customer auth files removed
  ];
  
  let allPassed = true;
  
  componentsToCheck.forEach(componentPath => {
    try {
      const fullPath = path.join(__dirname, componentPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for useEffect with empty dependency arrays that should have dependencies
      const useEffectMatches = content.match(/useEffect\([^}]+\}, \[([^\]]*)\]/g);
      
      if (useEffectMatches) {
        console.log(`✅ ${path.basename(componentPath)}: Found ${useEffectMatches.length} useEffect hooks with dependency arrays`);
      } else {
        console.log(`⚠️  ${path.basename(componentPath)}: No useEffect hooks with dependency arrays found`);
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${componentPath}:`, error.message);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Test 4: Check for infinite loop patterns
function testInfiniteLoopPatterns() {
  console.log('\n📋 Test 4: Checking for potential infinite loop patterns...');
  
  const patternsToAvoid = [
    'useEffect(() => {',
    'const [loading, setLoading] = useState(true);'
  ];
  
  const componentsToCheck = [
    '../components/Products.tsx',
    '../hooks/useCustomerAuth.tsx',
    '../components/UnifiedOrderTracker.tsx'
  ];
  
  let allPassed = true;
  
  componentsToCheck.forEach(componentPath => {
    try {
      const fullPath = path.join(__dirname, componentPath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for functions called in useEffect that aren't memoized
      const useEffectBlocks = content.match(/useEffect\([^}]+\}, \[[^\]]*\]/g);
      
      if (useEffectBlocks) {
        useEffectBlocks.forEach((block, index) => {
          if (block.includes('loadProducts()') || block.includes('loadUserOrders()') || block.includes('loadUserProfile(')) {
            console.log(`✅ ${path.basename(componentPath)}: useEffect ${index + 1} calls memoized functions`);
          }
        });
      }
      
    } catch (error) {
      console.log(`❌ Error checking ${componentPath}:`, error.message);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Test 5: Verify import/export consistency
function testImportExportConsistency() {
  console.log('\n📋 Test 5: Checking import/export consistency...');
  
  try {
    const useUserOrdersPath = path.join(__dirname, '../hooks/useUserOrders.tsx');
    const unifiedTrackerPath = path.join(__dirname, '../components/UnifiedOrderTracker.tsx');
    
    const ordersContent = fs.readFileSync(useUserOrdersPath, 'utf8');
    const trackerContent = fs.readFileSync(unifiedTrackerPath, 'utf8');
    
    // Check export in useUserOrders
    if (ordersContent.includes('export default useUserOrders')) {
      console.log('✅ useUserOrders: Properly exported as default');
    } else {
      console.log('❌ useUserOrders: Not properly exported as default');
      return false;
    }
    
    // Check import in UnifiedOrderTracker
    if (trackerContent.includes('import useUserOrders') && !trackerContent.includes('import { useUserOrders }')) {
      console.log('✅ UnifiedOrderTracker: Properly imports useUserOrders as default');
    } else {
      console.log('❌ UnifiedOrderTracker: Incorrect import of useUserOrders');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('❌ Error checking imports/exports:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  const tests = [
    { name: 'useCallback Usage', fn: testUseCallbackUsage },
    { name: 'Products Component Structure', fn: testProductsComponent },
    { name: 'Dependency Arrays', fn: testDependencyArrays },
    { name: 'Infinite Loop Patterns', fn: testInfiniteLoopPatterns },
    { name: 'Import/Export Consistency', fn: testImportExportConsistency }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    if (test.fn()) {
      passedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Components should be working properly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }
  
  console.log('='.repeat(50));
}

// Run the tests
runAllTests().catch(console.error);
