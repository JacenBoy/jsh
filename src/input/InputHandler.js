class InputHandler {
  parseLine(line) {
    // Only trim the start to preserve trailing spaces
    const startTrimmed = line.trimStart();
    if (!startTrimmed) return null;

    // Find the first space to separate command from args
    const firstSpaceIndex = startTrimmed.indexOf(' ');
    
    if (firstSpaceIndex === -1) {
      // No spaces found, just a command
      return {
        command: startTrimmed,
        args: [],
        rawArgs: ''  // Add raw argument string for commands that need it
      };
    }

    // Split into command and raw args
    const command = startTrimmed.slice(0, firstSpaceIndex);
    const rawArgs = startTrimmed.slice(firstSpaceIndex + 1);
    
    // Also provide split args for commands that want them
    const args = rawArgs.trim().length > 0 ? rawArgs.trim().split(/\s+/) : [];

    return {
      command,
      args,
      rawArgs
    };
  }
}

module.exports = InputHandler;