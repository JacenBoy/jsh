class InputHandler {
  constructor(shell) {
    this.shell = shell;
  }

  parseLine(line) {
    // Only trim the start to preserve intentional trailing spaces
    const startTrimmed = this.shell.environmentManager.expand(line.trimStart());
    if (!startTrimmed) return null;

    const parsed = this.tokenize(startTrimmed);
    if (!parsed.length) return null;

    return {
      command: parsed[0],
      args: parsed.slice(1),
      rawArgs: startTrimmed.indexOf(' ') >= 0
        ? startTrimmed.slice(startTrimmed.indexOf(' ') + 1)
        : ''
    };
  }

  tokenize(line) {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let escaped = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (escaped) {
        // Handle escaped character
        current += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"' || char === "'") {
        if (inQuotes && char === quoteChar) {
          // End of quoted section
          inQuotes = false;
          quoteChar = '';
        } else if (!inQuotes) {
          // Start of quoted section
          inQuotes = true;
          quoteChar = char;
        } else {
          // Different quote character while already in quotes
          current += char;
        }
        continue;
      }

      if (char === ' ' && !inQuotes) {
        // Space outside quotes - token boundary
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