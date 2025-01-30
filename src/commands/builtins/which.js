const fs = require('fs');
const path = require('path');
const os = require('os');

class Which {
  constructor(shell) {
    this.shell = shell;
  }

  async execute(input) {
    const args = input.args;
    let allPaths = false;
    let startIndex = 0;

    // Parse options
    while (startIndex < args.length && args[startIndex].startsWith('-')) {
      switch (args[startIndex]) {
        case '-a':  // Show all matching paths
          allPaths = true;
          startIndex++;
          break;
        default:
          if (args[startIndex] === '--') {
            startIndex++;
          }
          break;
      }
    }

    if (startIndex >= args.length) {
      console.error('which: missing command name');
      console.error('Usage: which [-a] command...');
      return false;
    }

    let success = true;
    for (let i = startIndex; i < args.length; i++) {
      const command = args[i];
      const found = await this.findCommand(command, allPaths);

      if (found.length === 0) {
        console.error(`which: no ${command} in`);
        console.error(process.env.PATH);
        success = false;
      } else {
        found.forEach(location => console.log(location));
      }
    }

    return success;
  }

  async findCommand(command, allPaths) {
    const locations = [];

    // First check if it's a builtin
    if (this.shell.commandExecutor.builtins.hasCommand(command)) {
      locations.push(`${command}: shell built-in command`);
      if (!allPaths) return locations;
    }

    // Then check PATH
    const pathDirs = process.env.PATH.split(path.delimiter);
    const exeExtensions = os.platform() === 'win32'
      ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
      : [''];

    for (const dir of pathDirs) {
      for (const ext of exeExtensions) {
        const fullPath = path.join(dir, command + ext);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isFile()) {
            if (os.platform() === 'win32' || (stats.mode & fs.constants.S_IXUSR)) {
              locations.push(fullPath);
              if (!allPaths) return locations;
            }
          }
        } catch (error) {
          // File doesn't exist or isn't accessible, continue searching
          continue;
        }
      }
    }

    return locations;
  }
}

module.exports = Which;