class Exit {
  constructor(shell) {
    this.shell = shell;
  }

  async execute(input) {
    const args = input.args;
    const exitCode = args[0] || 0;

    // Use readline's close event to trigger the proper shutdown sequence
    this.shell.rl.close();

    // If for some reason the close event doesn't trigger, force exit after a timeout
    setTimeout(() => {
      process.exit(exitCode);
    }, 100);

    return true;
  }
}

module.exports = Exit;