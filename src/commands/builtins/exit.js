class Exit {
  constructor() {

  }

  async execute(args) {
    process.exit(args[0] || 0);
  }
}

module.exports = Exit;