const os = require('os');
const PathResolver = require('../../utils/PathResolver');

class CD {
  constructor() {
    this.pathResolver = new PathResolver();
  }

  async execute(input) {
    const args = input.args;

    const directory = args[0] || os.homedir();
    try {
      const newPath = this.pathResolver.resolvePath(directory);
      process.chdir(newPath);
      return true;
    } catch (error) {
      console.error(`cd: ${error.message}`);
      return false;
    }
  }
}

module.exports = CD;