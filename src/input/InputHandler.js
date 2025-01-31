const PathResolver = require('../utils/PathResolver');
const os = require('os');

class InputHandler {
  constructor(shell) {
    this.shell = shell;
    this.pathResolver = new PathResolver();
  }

  parseLine(line) {
    const startTrimmed = this.shell.environmentManager.expand(line.trimStart());
    if (!startTrimmed) return null;

    const expandedLine = this.expandTildeInCommand(startTrimmed);
    const parsed = this.tokenize(expandedLine);
    if (!parsed.length) return null;

    return {
      command: parsed[0],
      args: parsed.slice(1),
      rawArgs: expandedLine.indexOf(' ') >= 0
        ? expandedLine.slice(expandedLine.indexOf(' ') + 1)
        : ''
    };
  }

  expandTildeInCommand(line) {
    // Split into command and args while preserving quotes
    const parts = line.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) || [];
    
    if (parts.length === 0) return line;

    // Only expand ~ in the command part (first token)
    let command = parts[0];
    if (command.startsWith('~')) {
      try {
        command = this.pathResolver.normalizePath(command);
      } catch (error) {
        // If expansion fails, return original command
        return line;
      }
      
      // Reconstruct the line with expanded command
      return [command, ...parts.slice(1)].join(' ');
    }

    return line;
  }

  tokenize(line) {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escaped = false;
    const isWindows = os.platform() === 'win32';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (escaped) {
        // Always handle escaped characters
        if (inQuotes && quoteChar === '"') {
          // In double quotes, only escape certain characters
          if (char === '"' || char === '\\' || char === '$') {
            current += char;
          } else {
            current += '\\' + char;
          }
        } else {
          // Outside quotes or in single quotes, escape everything
          current += char;
        }
        escaped = false;
        continue;
      }

      if (char === '\\') {
        if (isWindows) {
          // Check if this is likely part of a Windows path
          const isWindowsPath =
            // Path characters that commonly follow a backslash
            (nextChar && (
              nextChar === '\\' || // Another backslash
              nextChar === ':' ||  // Drive letter
              /[A-Za-z0-9\.]/.test(nextChar) // Letters, numbers, dots
            )) &&
            // Not inside quotes (where it's more likely to be an escape)
            !inQuotes;

          if (isWindowsPath) {
            current += char;
            continue;
          }
        }
        escaped = true;
        continue;
      }

      if (char === '"' || char === "'") {
        if (inQuotes && char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        } else if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else {
          current += char;
        }
        continue;
      }

      if (char === ' ' && !inQuotes) {
        if (current) {
          tokens.push(current);
          current = '';
        }
        continue;
      }

      current += char;
    }

    // Add final token if any
    if (current) {
      tokens.push(current);
    }

    // Handle unclosed quotes
    if (inQuotes) {
      console.warn('Warning: Unclosed quotes in command');
    }

    return tokens;
  }
}

module.exports = InputHandler;