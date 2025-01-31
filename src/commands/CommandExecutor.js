const BuiltinCommands = require('./builtins');
const ProcessManager = require('../utils/ProcessManager');
const PathResolver = require('../utils/PathResolver');

class CommandExecutor {
  constructor(shell) {
    this.shell = shell;
    this.builtins = new BuiltinCommands(shell);
    this.processManager = new ProcessManager();
    this.pathResolver = new PathResolver();
  }

  async execute(input) {
    if (!input) return true;
  
    const { command, args } = input;
    if (!command) return true;

    // Expand ~ in arguments
    const expandedArgs = args.map(arg => {
      if (arg.includes('~')) {
        try {
          return this.pathResolver.normalizePath(arg);
        } catch (error) {
          return arg;
        }
      }
      return arg;
    });
    
    // Update input with expanded arguments
    input.args = expandedArgs;
  
    // Track alias expansion to prevent infinite recursion
    const expandedCommands = new Set([command]);
    
    // Keep expanding aliases until we either:
    // 1. Find a command that isn't an alias
    // 2. Find an alias we've already seen (loop prevention)
    let currentCommand = command;
    let expandedCommand;
    
    while ((expandedCommand = this.shell.aliasManager.expandAlias(currentCommand)) !== currentCommand) {
      if (expandedCommands.has(expandedCommand)) {
        console.error(`alias: circular reference detected: ${command}`);
        return false;
      }
      expandedCommands.add(expandedCommand);
      currentCommand = expandedCommand;
    }
    
    // If command was an alias, parse the final expanded command
    if (currentCommand !== command) {
      // Combine the expanded command with any additional arguments from the original input
      const fullCommand = input.args.length > 0 
        ? `${currentCommand} ${input.args.join(' ')}` 
        : currentCommand;
        
      const newInput = this.shell.inputHandler.parseLine(fullCommand);
      if (newInput) {
        // Don't recurse - we've already fully expanded the aliases
        if (this.builtins.hasCommand(newInput.command)) {
          return await this.builtins.execute(newInput.command, newInput);
        }
        return await this.processManager.spawnProcess(newInput.command, newInput.args);
      }
    }
  
    if (this.builtins.hasCommand(command)) {
      return await this.builtins.execute(command, input);
    }
  
    return await this.processManager.spawnProcess(command, input.args);
  }
}

module.exports = CommandExecutor;