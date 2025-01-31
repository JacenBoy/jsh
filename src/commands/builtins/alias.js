class Alias {
  constructor(shell) {
    this.shell = shell;
  }

  async execute(input) {
    const args = input.args;
    const aliasManager = this.shell.aliasManager;

    // With no arguments, list all aliases
    if (args.length === 0) {
      const aliases = aliasManager.getAllAliases();
      if (aliases.size === 0) {
        console.log('No aliases defined');
        return true;
      }

      for (const [name, command] of aliases) {
        console.log(`${name}='${command}'`);
      }
      return true;
    }

    // Handle alias removal with -r or --remove flag
    if (args[0] === '-r' || args[0] === '--remove') {
      if (args.length !== 2) {
        console.error('Usage: alias -r ALIAS');
        return false;
      }
      const removed = aliasManager.removeAlias(args[1]);
      if (!removed) {
        console.error(`alias: ${args[1]}: not found`);
        return false;
      }
      return true;
    }

    // Parse alias definition (name=command)
    const fullArg = input.rawArgs;
    const match = fullArg.match(/^([^=]+)=(.*)$/);
    
    if (!match) {
      // If no = is found, treat the argument as an alias name to display
      const alias = aliasManager.getAlias(args[0]);
      if (alias === undefined) {
        console.error(`alias: ${args[0]}: not found`);
        return false;
      }
      console.log(`${args[0]}='${alias}'`);
      return true;
    }

    const [, name, command] = match;
    // Remove surrounding quotes if present
    const cleanCommand = command.replace(/^(['"])(.*)\1$/, '$2');
    
    aliasManager.setAlias(name.trim(), cleanCommand.trim());
    return true;
  }
}

module.exports = Alias;