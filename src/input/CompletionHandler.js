const path = require('path');
const os = require('os');
const fs = require('fs');

class CompletionHandler {
  constructor() {
    // Preload executables cache
    this.executablesCache = new Set();
    this.updateExecutablesCache();
  }
  complete(line, cwd) {
    const words = line.split(' ');
    const currentWord = words[words.length - 1] || '';

    let matches = [];

    if (words.length <= 1) {
      // Completing command name
      matches = Array.from(this.executablesCache)
        .filter(exe => exe.toLowerCase().startsWith(currentWord.toLowerCase()));
    } else {
      // Completing file/directory name
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

    // Return matches and the substring we're completing
    return [matches, currentWord];
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