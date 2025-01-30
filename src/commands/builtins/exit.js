class Exit {
  constructor() {

  }

  async execute(input) {
    const args = input.args;
    
    process.exit(args[0] || 0);
  }
}

module.exports = Exit;