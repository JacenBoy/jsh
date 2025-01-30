const fs = require('fs').promises;
const path = require('path');
const { EOL } = require('os');

class ScriptHandler {
  constructor(shell) {
    this.shell = shell;
    this.variables = new Map();
    this.currentScript = null;
    this.lineNumber = 0;
  }

  async executeScript(scriptPath) {
    try {
      const absolutePath = path.resolve(scriptPath);
      const content = await fs.readFile(absolutePath, 'utf8');
      this.currentScript = absolutePath;
      this.lineNumber = 0;

      // Split content into lines, normalizing line endings
      const lines = content.split(/\r?\n/);

      // Execute each line
      for (let i = 0; i < lines.length; i++) {
        this.lineNumber = i + 1;
        const line = lines[i].trim();

        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue;

        // Handle flow control statements
        if (line.startsWith('if ')) {
          i = await this.handleIfStatement(lines, i);
          continue;
        }

        if (line.startsWith('for ')) {
          i = await this.handleForLoop(lines, i);
          continue;
        }

        if (line.startsWith('while ')) {
          i = await this.handleWhileLoop(lines, i);
          continue;
        }

        // Handle variable assignment
        if (line.includes('=') && !line.startsWith('env ')) {
          await this.handleVariableAssignment(line);
          continue;
        }

        // Handle command execution
        await this.executeCommand(line);
      }

      return true;
    } catch (error) {
      console.error(`Script error at ${this.currentScript}:${this.lineNumber}:`, error.message);
      return false;
    }
  }

  async executeCommand(line) {
    // Replace variables and command substitutions in command
    const expandedLine = await this.expandVariables(line);

    // Parse and execute the command
    const input = this.shell.inputHandler.parseLine(expandedLine);
    if (input) {
      return await this.shell.commandExecutor.execute(input);
    }
    return true;
  }

  async handleVariableAssignment(line) {
    const [name, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();

    // Remove quotes if present
    let cleanValue = value.replace(/^["']|["']$/g, '');

    // Handle arithmetic expressions
    if (value.startsWith('$((') && value.endsWith('))')) {
      const expression = value.slice(3, -2);
      try {
        // Safe eval of arithmetic expression
        const expandedExpr = await this.expandVariables(expression);
        const result = eval(expandedExpr);
        this.variables.set(name.trim(), result.toString());
      } catch (error) {
        throw new Error(`Invalid arithmetic expression: ${expression}`);
      }
    } else {
      // Expand variables and handle path escaping
      let expandedValue = await this.expandVariables(cleanValue);
      if (process.platform === 'win32' && expandedValue.includes('\\')) {
        expandedValue = this.escapeWindowsPaths(expandedValue);
      }
      this.variables.set(name.trim(), expandedValue);
    }
  }

  async expandVariables(str) {
    // First handle command substitution
    str = await this.expandCommands(str);

    // Then handle variable expansion
    return str.replace(/\$\{([^}]+)\}|\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, p1, p2) => {
      const varName = p1 || p2;

      // Check script variables first
      if (this.variables.has(varName)) {
        return this.variables.get(varName);
      }

      // Then check environment variables
      const envValue = this.shell.environmentManager.get(varName);
      return envValue !== undefined ? envValue : '';
    });
  }

  async expandCommands(str) {
    let result = str;
    let commandMatch;
    // Match $(command) pattern, handling nested parentheses
    const cmdRegex = /\$\(([^)(]*(?:\((?:[^)(]*(?:\([^)(]*\)[^)(]*)*)\)[^)(]*)*)\)/g;

    // Process all command substitutions, from innermost to outermost
    while ((commandMatch = cmdRegex.exec(str)) !== null) {
      const [fullMatch, command] = commandMatch;

      try {
        // Create a string buffer to capture output
        let output = [];
        const originalLog = console.log;

        // Override console.log to capture output
        console.log = (...args) => {
          const line = args.join(' ').trim();
          // Properly escape backslashes in paths on Windows
          if (process.platform === 'win32') {
            output.push(this.escapeWindowsPaths(line));
          } else {
            output.push(line);
          }
        };

        // Execute the command
        const input = this.shell.inputHandler.parseLine(command);
        if (input) {
          await this.shell.commandExecutor.execute(input);
        }

        // Restore console.log
        console.log = originalLog;

        // Join output lines with spaces, ensuring we have a valid string
        const outputStr = output.filter(Boolean).join(' ');
        result = result.replace(fullMatch, outputStr || '');
      } catch (error) {
        console.error(`Command substitution error: ${error.message}`);
        result = result.replace(fullMatch, '');
      }
    }

    return result.toString();
  }

  escapeWindowsPaths(str) {
    // Escape backslashes in Windows paths
    // but only if they're not already escaped
    return str.replace(/(?<!\\)\\(?!\\)/g, '\\\\');
  }

  async handleIfStatement(lines, startIndex) {
    const condition = lines[startIndex].slice(3);
    const block = [];
    let i = startIndex + 1;
    let elseBlock = null;

    // Find matching fi
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === 'fi') break;
      if (line === 'else') {
        elseBlock = [];
        i++;
        continue;
      }
      if (elseBlock) {
        elseBlock.push(line);
      } else {
        block.push(line);
      }
      i++;
    }

    // Evaluate condition
    const result = await this.evaluateCondition(condition);

    // Execute appropriate block
    const blockToExecute = result ? block : (elseBlock || []);
    for (const line of blockToExecute) {
      if (line && !line.startsWith('#')) {
        await this.executeCommand(line);
      }
    }

    return i;
  }

  async evaluateCondition(condition) {
    // Handle test command syntax
    if (condition.startsWith('[') && condition.endsWith(']')) {
      condition = condition.slice(1, -1).trim();
      return await this.evaluateTestCommand(condition);
    }

    // Handle command exit status
    const expanded = this.expandVariables(condition);
    const input = this.shell.inputHandler.parseLine(expanded);
    if (input) {
      return await this.shell.commandExecutor.execute(input);
    }
    return false;
  }

  async evaluateTestCommand(condition) {
    const parts = condition.split(' ').filter(p => p);

    switch (parts[0]) {
      case '-e': // File exists
        return await fs.access(this.expandVariables(parts[1])).then(() => true).catch(() => false);
      case '-d': // Is directory
        return await fs.stat(this.expandVariables(parts[1])).then(stats => stats.isDirectory()).catch(() => false);
      case '-f': // Is regular file
        return await fs.stat(this.expandVariables(parts[1])).then(stats => stats.isFile()).catch(() => false);
      case '-eq': // Numeric equality
        return Number(this.expandVariables(parts[1])) === Number(this.expandVariables(parts[2]));
      case '-ne': // Numeric inequality
        return Number(this.expandVariables(parts[1])) !== Number(this.expandVariables(parts[2]));
      case '-gt': // Greater than
        return Number(this.expandVariables(parts[1])) > Number(this.expandVariables(parts[2]));
      case '-lt': // Less than
        return Number(this.expandVariables(parts[1])) < Number(this.expandVariables(parts[2]));
      default:
        return false;
    }
  }

  async handleForLoop(lines, startIndex) {
    const forLine = lines[startIndex].trim();
    const match = forLine.match(/^for\s+(\w+)\s+in\s+(.+)$/);
    if (!match) throw new Error('Invalid for loop syntax');

    const [, varName, itemsExpr] = match;

    // Expand variables and commands in the items expression
    const expandedItems = await this.expandVariables(itemsExpr);
    if (typeof expandedItems !== 'string') {
      throw new Error('Loop items must resolve to a string');
    }

    // Split by whitespace while preserving quoted strings
    const itemList = expandedItems
      .match(/(['"].*?['"])|\S+/g)
      ?.map(item => item.replace(/^['"]|['"]$/g, '')) || [];

    const block = [];
    let i = startIndex + 1;

    // Find matching done
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === 'done') break;
      block.push(line);
      i++;
    }

    // Execute loop
    for (const item of itemList) {
      this.variables.set(varName, item);
      for (const line of block) {
        if (line && !line.startsWith('#')) {
          await this.executeCommand(line);
        }
      }
    }

    return i;
  }

  async handleWhileLoop(lines, startIndex) {
    const condition = lines[startIndex].slice(6);
    const block = [];
    let i = startIndex + 1;

    // Find matching done
    while (i < lines.length) {
      const line = lines[i].trim();
      if (line === 'done') break;
      block.push(line);
      i++;
    }

    // Execute loop
    while (await this.evaluateCondition(condition)) {
      for (const line of block) {
        if (line && !line.startsWith('#')) {
          await this.executeCommand(line);
        }
      }
    }

    return i;
  }
}

module.exports = ScriptHandler;