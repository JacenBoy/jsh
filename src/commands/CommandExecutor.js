const BuiltinCommands = require('./builtins');
const ProcessManager = require('../utils/ProcessManager');

class CommandExecutor {
  constructor(shell) {
    this.builtins = new BuiltinCommands(shell);
    this.processManager = new ProcessManager();
  }

  async execute(input) {
    if (!input) return true;

    const { command } = input;
    if (!command) return true;

    if (this.builtins.hasCommand(command)) {
      // Pass the entire input object to builtin commands
      return await this.builtins.execute(command, input);
    }

    // For external commands, continue using just the args array
    return await this.processManager.spawnProcess(command, input.args);
  }
}

module.exports = CommandExecutor;