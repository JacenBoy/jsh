const path = require('path');
const os = require('os');
const fs = require('fs');

class CompletionHandler {
  constructor(shell) {
    this.shell = shell;
    // Preload executables cache
    this.executablesCache = new Set();
    this.updateExecutablesCache();
  }

  complete(line, cwd) {
    const words = line.split(' ');
    const currentWord = words[words.length - 1] || '';

    let matches = [];

    if (words.length <= 1) {
      // Completing command name - combine builtins and executables
      const builtinCommands = Object.keys(this.shell.commandExecutor.builtins.commands);

      // Create a combined set of completions
      const allCommands = new Set([
        ...Array.from(this.executablesCache),
        ...builtinCommands
      ]);

      matches = Array.from(allCommands)
        .filter(cmd => cmd.toLowerCase().startsWith(currentWord.toLowerCase()));

      // Sort matches to show builtins first
      matches.sort((a, b) => {
        const aIsBuiltin = builtinCommands.includes(a);
        const bIsBuiltin = builtinCommands.includes(b);
        if (aIsBuiltin && !bIsBuiltin) return -1;
        if (!aIsBuiltin && bIsBuiltin) return 1;
        return a.localeCompare(b);
      });
    } else {
      // Handle specific command argument completion
      const command = words[0].toLowerCase();

      // Add special completion for specific built-in commands
      if (this.shell.commandExecutor.builtins.hasCommand(command)) {
        matches = this.completeBuiltinArgs(command, words, currentWord, cwd);
      }

      // If no special completion or it's not a builtin, fall back to file/directory completion
      if (matches.length === 0) {
        let basePath = currentWord;
        let searchDir = cwd;

        if (path.dirname(currentWord) !== '.') {
          searchDir = path.resolve(cwd, path.dirname(currentWord));
          basePath = path.basename(currentWord);
        }

        const items = this.getFilesAndDirs(searchDir);
        matches = items.filter(item =>
          item.toLowerCase().startsWith(basePath.toLowerCase())
        );

        // Add the directory prefix back to matches if there was one
        if (path.dirname(currentWord) !== '.') {
          matches = matches.map(match =>
            path.join(path.dirname(currentWord), match)
          );
        }
      }
    }

    // Return matches and the substring we're completing
    return [matches, currentWord];
  }

  completeBuiltinArgs(command, words, currentWord, cwd) {
    // Special completion logic for specific built-in commands
    switch (command) {
      case 'cd':
        // Only complete directories for cd
        return this.getFilesAndDirs(cwd)
          .filter(item => item.endsWith('/') &&
            item.toLowerCase().startsWith(currentWord.toLowerCase()));

      case 'env':
        // Complete -p, -u flags and environment variable names
        if (currentWord.startsWith('-')) {
          return ['-p', '-u', '-l'].filter(flag =>
            flag.startsWith(currentWord));
        }
        // Complete environment variable names
        return Object.keys(this.shell.environmentManager.getAll())
          .filter(name => name.toLowerCase()
            .startsWith(currentWord.toLowerCase()));

      case 'path':
        // Complete subcommands and flags
        if (words.length <= 2) {
          return ['add', 'remove']
            .filter(cmd => cmd.startsWith(currentWord));
        }
        if (words[1] === 'add' && currentWord === '-') {
          return ['-p'];
        }
        return [];

      case 'history':
        // Complete flags
        if (currentWord.startsWith('-')) {
          return ['-c', '--clear'].filter(flag =>
            flag.startsWith(currentWord));
        }
        return [];

      default:
        return [];
    }
  }

  updateExecutablesCache() {
    const pathEnv = process.env.PATH || '';
    const pathSeparator = os.platform() === 'win32' ? ';' : ':';
    const pathDirs = pathEnv.split(pathSeparator);
    const exeExtensions = os.platform() === 'win32'
      ? (process.env.PATHEXT || '.EXE;.CMD;.BAT').split(';')
      : [''];

    for (const dir of pathDirs) {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              if (os.platform() === 'win32') {
                // Check if file ends with any of the executable extensions
                if (exeExtensions.some(ext => file.toUpperCase().endsWith(ext))) {
                  this.executablesCache.add(file);
                }
              } else {
                // On Unix-like systems, check if file is executable
                if ((stats.mode & fs.constants.S_IXUSR) !== 0) {
                  this.executablesCache.add(file);
                }
              }
            }
          } catch (error) {
            // Skip files we can't access
            continue;
          }
        }
      } catch (error) {
        // Skip directories we can't access
        continue;
      }
    }
  }

  getFilesAndDirs(dir) {
    try {
      const items = fs.readdirSync(dir);
      return items.map(item => {
        const fullPath = path.join(dir, item);
        try {
          const stats = fs.statSync(fullPath);
          return stats.isDirectory() ? `${item}/` : item;
        } catch (error) {
          return item;
        }
      });
    } catch (error) {
      return [];
    }
  }
}

module.exports = CompletionHandler;