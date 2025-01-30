class History {
  constructor(shell) {
    this.shell = shell;
  }

  async execute(input) {
    const args = input.args;

    if (args.length === 0) {
      // Display history with line numbers
      const history = this.shell.historyManager.getHistory();
      // Display history with newest commands at the top
      [...history].reverse().forEach((cmd, i) => {
        //const num = history.length - i;
        const num = i + 1;
        console.log(`${num.toString().padStart(4)}  ${cmd}`);
      });
      return true;
    }

    if (args[0] === '-c' || args[0] === '--clear') {
      await this.shell.historyManager.clear();
      return true;
    }

    console.error('Usage: history [-c|--clear]');
    return false;
  }
}

module.exports = History;