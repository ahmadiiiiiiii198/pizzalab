#!/usr/bin/env node

/**
 * Runtime Test Script
 * Tests the actual runtime behavior of the application
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

console.log('🚀 Starting Runtime Tests...\n');

async function testServerStartup() {
  console.log('📋 Test 1: Server Startup Test...');
  
  return new Promise((resolve) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let hasStarted = false;
    
    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Local:   http://localhost:3000/') && !hasStarted) {
        hasStarted = true;
        console.log('✅ Server started successfully');
        server.kill();
        resolve(true);
      }
    });
    
    server.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error') && !error.includes('PostCSS')) {
        console.log('❌ Server startup error:', error);
        server.kill();
        resolve(false);
      }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!hasStarted) {
        console.log('❌ Server startup timeout');
        server.kill();
        resolve(false);
      }
    }, 30000);
  });
}

async function testComponentCompilation() {
  console.log('\n📋 Test 2: Component Compilation Test...');
  
  return new Promise((resolve) => {
    const build = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    let errorOutput = '';
    
    build.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    build.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('✅ All components compiled successfully');
        resolve(true);
      } else {
        console.log('❌ Compilation failed');
        console.log('Error output:', errorOutput);
        resolve(false);
      }
    });
  });
}

async function testTypeScript() {
  console.log('\n📋 Test 3: TypeScript Type Checking...');
  
  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      stdio: 'pipe',
      shell: true
    });
    
    let errorOutput = '';
    
    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ No TypeScript errors found');
        resolve(true);
      } else {
        console.log('❌ TypeScript errors found:');
        console.log(errorOutput);
        resolve(false);
      }
    });
  });
}

async function runAllRuntimeTests() {
  console.log('🧪 Running Runtime Tests...\n');
  
  const tests = [
    { name: 'Server Startup', fn: testServerStartup },
    { name: 'Component Compilation', fn: testComponentCompilation },
    { name: 'TypeScript Type Checking', fn: testTypeScript }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RUNTIME TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All runtime tests passed! Application is working properly.');
  } else {
    console.log('⚠️  Some runtime tests failed. Please check the issues above.');
  }
  
  console.log('='.repeat(50));
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Run the tests
runAllRuntimeTests().catch((error) => {
  console.error('❌ Runtime test suite failed:', error);
  process.exit(1);
});
