const path = require('path');

class PathResolver {
  resolvePath(directory) {
    return path.resolve(process.cwd(), directory);
  }
}

module.exports = PathResolver;