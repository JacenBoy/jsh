class Echo {
  constructor() {
  }

  async execute(input) {
    const args = input.args;
    let interpretEscapes = true;
    let addNewline = true;
    let startIndex = 0;

    // Parse options
    while (startIndex < args.length && args[startIndex].startsWith('-')) {
      switch (args[startIndex]) {
        case '-n':  // Don't output trailing newline
          addNewline = false;
          startIndex++;
          break;
        case '-e':  // Interpret escape sequences
          interpretEscapes = true;
          startIndex++;
          break;
        case '-E':  // Don't interpret escape sequences
          interpretEscapes = false;
          startIndex++;
          break;
        default:
          if (args[startIndex] === '--') {
            startIndex++;
            break;
          }
          // If it's an unknown option, treat it as regular text
          break;
      }
    }

    // Process the remaining arguments
    let output = args.slice(startIndex).join(' ');

    if (interpretEscapes) {
      output = output.replace(/\\[abfnrtv\\]/g, match => {
        const escapes = {
          '\\a': '\x07', // Bell
          '\\b': '\b',   // Backspace
          '\\f': '\f',   // Form feed
          '\\n': '\n',   // New line
          '\\r': '\r',   // Carriage return
          '\\t': '\t',   // Tab
          '\\v': '\v',   // Vertical tab
          '\\\\': '\\'   // Backslash
        };
        return escapes[match] || match;
      });
    }

    // Print the output
    process.stdout.write(output);
    if (addNewline) {
      process.stdout.write('\n');
    }

    return true;
  }
}

module.exports = Echo;