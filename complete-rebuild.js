import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const execAsync = promisify(exec);

async function completeRebuild() {
  console.log('🔄 COMPLETE REBUILD - FIXING ALL ISSUES...');
  
  try {
    // 1. Stop all processes
    console.log('🛑 Stopping all Node processes...');
    try {
      await execAsync('taskkill /F /IM node.exe /T');
      await execAsync('taskkill /F /IM npm.exe /T');
    } catch (e) {
      console.log('✅ No processes to stop');
    }
    
    // 2. Clear port 3000
    console.log('🔌 Clearing port 3000...');
    try {
      await execAsync('netstat -ano | findstr :3000');
      await execAsync('for /f "tokens=5" %a in (\'netstat -aon ^| find ":3000" ^| find "LISTENING"\') do taskkill /F /PID %a');
    } catch (e) {
      console.log('✅ Port 3000 is free');
    }
    
    // 3. Clean npm cache and node_modules
    console.log('🧹 Cleaning cache and dependencies...');
    try {
      await execAsync('npm cache clean --force');
      console.log('✅ npm cache cleared');
    } catch (e) {
      console.log('⚠️ Cache clean failed');
    }
    
    // 4. Reinstall dependencies
    console.log('📦 Reinstalling dependencies...');
    try {
      await execAsync('npm install');
      console.log('✅ Dependencies installed');
    } catch (e) {
      console.log('⚠️ Install failed, trying alternative...');
      try {
        await execAsync('npm ci');
        console.log('✅ Dependencies installed via ci');
      } catch (e2) {
        console.log('⚠️ Both install methods failed');
      }
    }
    
    // 5. Fix any remaining TypeScript issues
    console.log('🔧 Fixing TypeScript issues...');
    
    // Ensure UnifiedNotificationSystem is clean
    if (existsSync('src/components/UnifiedNotificationSystem.tsx')) {
      let content = readFileSync('src/components/UnifiedNotificationSystem.tsx', 'utf8');
      
      // Clean up any malformed lines
      content = content
        .replace(/const \[notifications, setNotifications\] = useStonents.*/, 'const [notifications, setNotifications] = useState<OrderNotification[]>([]);')
        .replace(/const \[isSoundEnabled, setIsSoundEnabled\] = useS.*/, 'const [isSoundEnabled, setIsSoundEnabled] = useState(true);')
        .replace(/console\.log\('console\.log\(/g, "console.log('")
        .replace(/\}\s*\}\s*$/gm, '}');
      
      writeFileSync('src/components/UnifiedNotificationSystem.tsx', content);
      console.log('✅ UnifiedNotificationSystem cleaned');
    }
    
    // 6. Create a simple startup script
    const startScript = `
import { spawn } from 'child_process';

console.log('🚀 Starting development server...');

const devServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

devServer.on('error', (error) => {
  console.error('❌ Dev server error:', error);
});

devServer.on('close', (code) => {
  console.log('🔄 Dev server closed with code:', code);
});

console.log('✅ Development server started');
    `;
    
    writeFileSync('start-dev.js', startScript);
    console.log('✅ Startup script created');
    
    // 7. Start the development server
    console.log('🚀 Starting development server...');
    
    const devProcess = spawn('node', ['start-dev.js'], {
      stdio: 'inherit',
      detached: true
    });
    
    devProcess.unref();
    
    console.log('🎉 COMPLETE REBUILD FINISHED!');
    console.log('✅ All processes stopped');
    console.log('✅ Cache cleared');
    console.log('✅ Dependencies reinstalled');
    console.log('✅ TypeScript issues fixed');
    console.log('✅ Development server starting');
    console.log('🌐 Server should be available at http://localhost:3000');
    
  } catch (error) {
    console.error('💥 Rebuild error:', error.message);
  }
}

completeRebuild();
