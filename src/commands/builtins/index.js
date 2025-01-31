const CD = require('./cd');
const PWD = require('./pwd');
const Echo = require('./echo');
const Prompt = require('./prompt');
const Alias = require('./alias');
const Env = require('./env');
const Path = require('./path');
const Which = require('./which');
const History = require('./history');
const Eval = require('./eval');
const Source = require('./source');
const Exit = require('./exit');

class BuiltinCommands {
  constructor(shell) {
    this.commands = {
      cd: new CD(),
      pwd: new PWD(),
      echo: new Echo(),
      prompt: new Prompt(shell),
      alias: new Alias(shell),
      env: new Env(shell),
      path: new Path(shell),
      which: new Which(shell),
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