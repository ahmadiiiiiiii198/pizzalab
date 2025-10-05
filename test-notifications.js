const { chromium } = require('playwright');

async function testNotificationSystem() {
  console.log('🎭 Starting Playwright notification system test...');
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    args: ['--autoplay-policy=no-user-gesture-required'] // Allow audio autoplay
  });
  
  const context = await browser.newContext({
    permissions: ['notifications', 'microphone'] // Grant audio permissions
  });
  
  const page = await context.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(logEntry);
    console.log(`🔍 Console: ${logEntry}`);
  });
  
  // Capture errors
  page.on('pageerror', error => {
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  try {
    console.log('📱 Navigating to ordini page...');
    await page.goto('http://localhost:3001/ordini', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    // Check if UnifiedNotificationSystem is loaded
    console.log('🔍 Checking for notification system...');
    const notificationSystem = await page.locator('[class*="notification"]').first();
    if (await notificationSystem.isVisible()) {
      console.log('✅ Notification system UI found');
    } else {
      console.log('❌ Notification system UI not found');
    }
    
    // Look for notification buttons
    const fetchButton = page.locator('button:has-text("FETCH")');
    const createButton = page.locator('button:has-text("CREATE TEST")');
    const stopButton = page.locator('button:has-text("STOP")');
    
    if (await fetchButton.isVisible()) {
      console.log('✅ FETCH button found');
    }
    if (await createButton.isVisible()) {
      console.log('✅ CREATE TEST button found');
    }
    if (await stopButton.isVisible()) {
      console.log('✅ STOP button found');
    }
    
    // Wait for initial logs
    console.log('⏳ Waiting for initial notification system logs...');
    await page.waitForTimeout(5000);
    
    // Try manual fetch
    if (await fetchButton.isVisible()) {
      console.log('🔄 Clicking FETCH button...');
      await fetchButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Try creating a test notification
    if (await createButton.isVisible()) {
      console.log('➕ Clicking CREATE TEST button...');
      await createButton.click();
      await page.waitForTimeout(3000);
    }
    
    // Wait a bit more to see if sound triggers
    console.log('⏳ Waiting for sound trigger...');
    await page.waitForTimeout(5000);
    
    // Filter and analyze logs
    console.log('\n📊 ANALYSIS OF CONSOLE LOGS:');
    console.log('=' * 50);
    
    const unifiedLogs = consoleLogs.filter(log => log.includes('[UnifiedNotification]'));
    const soundLogs = consoleLogs.filter(log => log.includes('🔊') || log.includes('🔇'));
    const fetchLogs = consoleLogs.filter(log => log.includes('Fetching notifications'));
    const realtimeLogs = consoleLogs.filter(log => log.includes('real-time') || log.includes('subscription'));
    const errorLogs = consoleLogs.filter(log => log.includes('error') || log.includes('Error'));
    
    console.log(`\n🔍 UnifiedNotification logs (${unifiedLogs.length}):`);
    unifiedLogs.forEach(log => console.log(`  ${log}`));
    
    console.log(`\n🔊 Sound-related logs (${soundLogs.length}):`);
    soundLogs.forEach(log => console.log(`  ${log}`));
    
    console.log(`\n📡 Fetch logs (${fetchLogs.length}):`);
    fetchLogs.forEach(log => console.log(`  ${log}`));
    
    console.log(`\n📡 Real-time logs (${realtimeLogs.length}):`);
    realtimeLogs.forEach(log => console.log(`  ${log}`));
    
    console.log(`\n❌ Error logs (${errorLogs.length}):`);
    errorLogs.forEach(log => console.log(`  ${log}`));
    
    // Check for specific issues
    console.log('\n🔍 DIAGNOSTIC CHECKS:');
    console.log('=' * 30);
    
    const hasInitialization = unifiedLogs.some(log => log.includes('Initializing'));
    const hasSubscription = realtimeLogs.some(log => log.includes('SUBSCRIBED'));
    const hasFetch = fetchLogs.length > 0;
    const hasSoundTrigger = soundLogs.some(log => log.includes('TRIGGERING SOUND'));
    const hasAudioError = errorLogs.some(log => log.includes('audio') || log.includes('Audio'));
    
    console.log(`✅ System initialized: ${hasInitialization}`);
    console.log(`✅ Real-time subscribed: ${hasSubscription}`);
    console.log(`✅ Fetch attempted: ${hasFetch}`);
    console.log(`✅ Sound trigger found: ${hasSoundTrigger}`);
    console.log(`❌ Audio errors: ${hasAudioError}`);
    
    if (!hasSoundTrigger) {
      console.log('\n🚨 SOUND NOT TRIGGERING - Possible causes:');
      console.log('  - No unread notifications found');
      console.log('  - Sound disabled in state');
      console.log('  - Already playing check failing');
      console.log('  - Real-time subscription not working');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 more seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

// Run the test
testNotificationSystem().catch(console.error);
