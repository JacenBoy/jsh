class InputHandler {
  parseLine(line) {
    const trimmedInput = line.trim();
    if (!trimmedInput) return null;

    const [command, ...args] = trimmedInput.split(' ');
    return {
      command,
      args
    };
  }
}

module.exports = InputHandler;