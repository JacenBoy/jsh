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

    // Check if the first word is an alias and expand it
    if (words.length > 0 && words[0]) {
      const expandedCommand = this.expandAliasForCompletion(words[0]);
      if (expandedCommand !== words[0]) {
        // Create a new line with the expanded alias
        const expandedWords = this.shell.inputHandler.parseLine(expandedCommand)?.args || [];
        // Preserve any additional arguments after the alias
        const newLine = [...expandedWords, ...words.slice(1)].join(' ');
        // Get completions for the expanded command
        return this.getCompletionsForLine(newLine, currentWord, cwd);
      }
    }

    return this.getCompletionsForLine(line, currentWord, cwd);
  }

  expandAliasForCompletion(command) {
    // Track expanded commands to prevent infinite recursion
    const seen = new Set([command]);
    let current = command;
    let expanded;

    while ((expanded = this.shell.aliasManager.getAlias(current))) {
      // Get just the command part if there are arguments
      const expandedCommand = this.shell.inputHandler.parseLine(expanded)?.command;
      if (!expandedCommand || seen.has(expandedCommand)) {
        break;
      }
      seen.add(expandedCommand);
      current = expandedCommand;
    }

    return this.shell.aliasManager.getAlias(command) || command;
  }

  getCompletionsForLine(line, currentWord, cwd) {
    const words = line.split(' ');
    let matches = [];

    if (words.length <= 1) {
      // Completing command name - combine builtins, aliases, and executables
      const builtinCommands = Object.keys(this.shell.commandExecutor.builtins.commands);
      const aliasNames = Array.from(this.shell.aliasManager.getAllAliases().keys());

      // Create a combined set of completions
      const allCommands = new Set([
        ...Array.from(this.executablesCache),
        ...builtinCommands,
        ...aliasNames
      ]);

      matches = Array.from(allCommands)
        .filter(cmd => cmd.toLowerCase().startsWith(currentWord.toLowerCase()));

      // Sort matches to show builtins first, then aliases, then executables
      matches.sort((a, b) => {
        const aIsBuiltin = builtinCommands.includes(a);
        const bIsBuiltin = builtinCommands.includes(b);
        const aIsAlias = aliasNames.includes(a);
        const bIsAlias = aliasNames.includes(b);
        
        if (aIsBuiltin && !bIsBuiltin) return -1;
        if (!aIsBuiltin && bIsBuiltin) return 1;
        if (aIsAlias && !bIsAlias) return -1;
        if (!aIsAlias && bIsAlias) return 1;
        return a.localeCompare(b);
      });
    } else {
      // Handle specific command argument completion
      const command = words[0].toLowerCase();

      // First check builtins
      if (this.shell.commandExecutor.builtins.hasCommand(command)) {
        matches = this.completeBuiltinArgs(command, words, currentWord, cwd);
      }

      // If no matches from builtins, fall back to file/directory completion
      if (matches.length === 0) {
        matches = this.getFileCompletions(currentWord, cwd);
      }
    }

    return [matches, currentWord];
  }

  getFileCompletions(currentWord, cwd) {
    let basePath = currentWord;
    let searchDir = cwd;

    if (path.dirname(currentWord) !== '.') {
      searchDir = path.resolve(cwd, path.dirname(currentWord));
      basePath = path.basename(currentWord);
    }

    const items = this.getFilesAndDirs(searchDir);
    let matches = items.filter(item =>
      item.toLowerCase().startsWith(basePath.toLowerCase())
    );

    // Add the directory prefix back to matches if there was one
    if (path.dirname(currentWord) !== '.') {
      matches = matches.map(match =>
        path.join(path.dirname(currentWord), match)
      );
    }

    return matches;
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

      case 'echo':
        // Complete flags
        if (currentWord.startsWith('-')) {
          return ['-n', '-e', '-E', '--'].filter(flag =>
            flag.startsWith(currentWord));
        }
        return [];

      case 'alias':
        // If the word starts with a dash, complete flags
        if (currentWord.startsWith('-')) {
          return ['-r', '--remove'].filter(flag => 
            flag.startsWith(currentWord)
          );
        }
        
        // If we're after a -r or --remove flag, complete with existing alias names
        if (words[words.length - 2] === '-r' || words[words.length - 2] === '--remove') {
          const aliases = Array.from(this.shell.aliasManager.getAllAliases().keys());
          return aliases.filter(alias => 
            alias.toLowerCase().startsWith(currentWord.toLowerCase())
          );
        }
        
        // If there's an equals sign in the current word, don't complete
        if (currentWord.includes('=')) {
          return [];
        }
        
        // Otherwise, suggest existing alias names 
        const aliases = Array.from(this.shell.aliasManager.getAllAliases().keys());
        return aliases.filter(alias => 
          alias.toLowerCase().startsWith(currentWord.toLowerCase())
        );

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