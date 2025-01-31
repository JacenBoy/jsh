const { spawn } = require('child_process');

class ProcessManager {
  spawnProcess(command, args) {
    return new Promise((resolve) => {
      // If command contains path separators, resolve it as a path
      const finalCommand = command.includes('/') || command.includes('\\') 
        ? command  // Keep absolute/relative paths as-is
        : command; // Let the shell resolve command lookup
      
      const childProcess = spawn(finalCommand, args, {
        cwd: process.cwd(),
        stdio: 'inherit',
        shell: true
      });

      childProcess.on('error', (error) => {
        console.error(`Command failed: ${error.message}`);
        resolve(false);
      });

      childProcess.on('exit', (code) => {
        if (code !== 0) {
          console.error(`Command exited with code ${code}`);
        }
        resolve(code === 0);
      });
    });
  }
}

module.exports = ProcessManager;