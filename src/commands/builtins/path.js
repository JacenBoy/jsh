const path = require('path');
const os = require('os');

class Path {
  constructor(shell) {
    this.shell = shell;
  }

  // Helper method to find the actual PATH variable name in current environment
  findPathVariableName() {
    if (os.platform() === 'win32') {
      // On Windows, search case-insensitively
      const envKeys = Object.keys(this.shell.environmentManager.getAll());
      return envKeys.find(key => key.toUpperCase() === 'PATH') || 'Path';
    }
    return 'PATH';
  }

  async execute(input) {
    const args = input.args;
    const envManager = this.shell.environmentManager;
    const pathSeparator = os.platform() === 'win32' ? ';' : ':';
    const pathVarName = this.findPathVariableName();

    if (args.length === 0) {
      // Display current PATH entries, one per line
      const currentPath = envManager.get(pathVarName) || '';
      console.log(`Current ${pathVarName} entries:`);
      const paths = currentPath.split(pathSeparator).filter(p => p);
      if (paths.length === 0) {
        console.log('(empty)');
      } else {
        paths.forEach((p, index) => {
          console.log(`${index + 1}. ${p}`);
        });
      }
      return true;
    }

    switch (args[0]) {
      case 'add': {
        if (!args[1]) {
          console.error('Usage: path add <directory> [-p]');
          return false;
        }

        const persistent = args[2] === '-p';
        const newPath = path.resolve(args[1]);
        const currentPath = envManager.get(pathVarName) || '';
        // Split and filter to remove empty entries that might appear with extra separators
        const paths = new Set(currentPath.split(pathSeparator).filter(p => p));

        // Add the new path if it's not already present
        if (!paths.has(newPath)) {
          paths.add(newPath);
          const newPathString = Array.from(paths).join(pathSeparator);
          envManager.set(pathVarName, newPathString, persistent);
          console.log(`Added "${newPath}" to ${pathVarName}${persistent ? ' (persistent)' : ''}`);

          // Update completion handler's executable cache
          if (this.shell.completionHandler) {
            this.shell.completionHandler.updateExecutablesCache();
          }
        } else {
          console.log(`"${newPath}" is already in ${pathVarName}`);
        }
        break;
      }

      case 'remove': {
        if (!args[1]) {
          console.error('Usage: path remove <directory>');
          return false;
        }

        const targetPath = path.resolve(args[1]);
        const currentPath = envManager.get(pathVarName) || '';
        const paths = currentPath.split(pathSeparator).filter(p => p);

        const newPaths = paths.filter(p => path.resolve(p) !== targetPath);

        if (newPaths.length !== paths.length) {
          const newPathString = newPaths.join(pathSeparator);
          // Preserve persistence status if PATH was already persistent
          const isPersistent = envManager.isPersistent(pathVarName);
          envManager.set(pathVarName, newPathString, isPersistent);
          console.log(`Removed "${targetPath}" from ${pathVarName}`);

          // Update completion handler's executable cache
          if (this.shell.completionHandler) {
            this.shell.completionHandler.updateExecutablesCache();
          }
        } else {
          console.log(`"${targetPath}" not found in ${pathVarName}`);
        }
        break;
      }

      default:
        console.error('Usage: path [add|remove] <directory> [-p]');
        console.error('  add    - Add directory to PATH');
        console.error('  remove - Remove directory from PATH');
        console.error('  -p     - Make change persistent (with add)');
        console.error('If no arguments given, displays current PATH entries');
        return false;
    }

    return true;
  }
}

module.exports = Path;