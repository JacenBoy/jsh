const CD = require('./cd');
const PWD = require('./pwd');
const Prompt = require('./prompt');
const Env = require('./env');
const Path = require('./path');
const History = require('./history');
const Eval = require('./eval');
const Source = require('./source');
const Exit = require('./exit');

class BuiltinCommands {
  constructor(shell) {
    this.commands = {
      cd: new CD(),
      pwd: new PWD(),
      prompt: new Prompt(shell),
      env: new Env(shell),
      path: new Path(shell),
      history: new History(shell),
      exit: new Exit(shell),
      eval: new Eval(),
      source: new Source(shell)
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