const BuiltinCommands = require('./builtins');
const ProcessManager = require('../utils/ProcessManager');

class CommandExecutor {
  constructor() {
    this.builtins = new BuiltinCommands();
    this.processManager = new ProcessManager();
  }

  async execute({ command, args }) {
    if (!command) return;

    if (this.builtins.hasCommand(command)) {
      return await this.builtins.execute(command, args);
    }

    return await this.processManager.spawnProcess(command, args);
  }
}

module.exports = CommandExecutor;
