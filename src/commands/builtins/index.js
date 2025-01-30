const CD = require('./cd');
const PWD = require('./pwd');
const Prompt = require('./prompt');
const Exit = require('./exit');

class BuiltinCommands {
  constructor(shell) {
    this.commands = {
      cd: new CD(),
      pwd: new PWD(),
      prompt: new Prompt(shell),
      exit: new Exit()
    };
  }

  hasCommand(command) {
    return command in this.commands;
  }

  async execute(command, args) {
    return await this.commands[command].execute(args);
  }
}

module.exports = BuiltinCommands;