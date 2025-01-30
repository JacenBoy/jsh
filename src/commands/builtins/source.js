const ScriptHandler = require('../../utils/ScriptHandler');

class Source {
  constructor(shell) {
    this.shell = shell;
    this.scriptHandler = new ScriptHandler(this.shell);
  }

  async execute(input) {
    const args = input.args;

    if (args.length !== 1) {
      console.error('Usage: source <script-file>');
      return false;
    }

    return await this.scriptHandler.executeScript(args[0]);
  }
}

module.exports = Source;