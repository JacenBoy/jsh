const readline = require('readline');
const CommandExecutor = require('../commands/CommandExecutor');
const InputHandler = require('../input/InputHandler');

class Shell {
  constructor() {
    this.inputHandler = new InputHandler();
    this.commandExecutor = new CommandExecutor();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '$ '
    });

    this.setupShell();
  }

  setupShell() {
    this.rl.on('line', async (line) => {
      const input = this.inputHandler.parseLine(line);
      await this.commandExecutor.execute(input);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye!');
      process.exit(0);
    });
  }

  start() {
    this.rl.prompt();
  }
}

module.exports = Shell;