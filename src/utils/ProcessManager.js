const { spawn } = require('child_process');

class ProcessManager {
  spawnProcess(command, args) {
    return new Promise((resolve) => {
      const childProcess = spawn(command, args, {
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