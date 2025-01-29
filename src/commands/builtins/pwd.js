const PathResolver = require('../../utils/PathResolver');

class PWD {
  constructor() {
    this.pathResolver = new PathResolver();
  }

  async execute(args) {
    const cwd = this.pathResolver.resolvePath(".");
    return console.log(cwd);
  }
}

module.exports = PWD;