import { spawn } from 'child_process';
import { readFileSync } from 'fs';

function autoRestartDev() {
  console.log('🔄 AUTO-RESTARTING DEVELOPMENT SERVER...');
  
  try {
    // Check if package.json has the dev script
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts.dev) {
      console.log('✅ Found dev script, restarting...');
      
      // Kill any existing dev processes (Windows)
      const killProcess = spawn('taskkill', ['/F', '/IM', 'node.exe', '/T'], { 
        stdio: 'pipe',
        shell: true 
      });
      
      killProcess.on('close', () => {
        console.log('🔄 Processes cleared, starting fresh...');
        
        // Wait a moment then start dev server
        setTimeout(() => {
          const devProcess = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true,
            detached: true
          });
          
          devProcess.unref();
          console.log('🚀 Development server restarted automatically');
          
        }, 2000);
      });
      
    } else {
      console.log('⚠️ No dev script found in package.json');
    }
    
  } catch (error) {
    console.log('⚠️ Auto-restart error:', error.message);
    console.log('📋 Please manually restart your dev server: npm run dev');
  }
}

autoRestartDev();
