const os = require('os');
const path = require('path');

class PromptManager {
  constructor(config = {}) {
    this.config = {
      template: config.template || '[\\u@\\h \\w]$ ',
      symbols: {
        ...this.getDefaultSymbols(),
        ...(config.symbols || {})
      }
    };
  }

  getDefaultSymbols() {
    return {
      '\\u': () => os.userInfo().username,
      '\\h': () => os.hostname(),
      '\\w': () => {
        const homeDir = os.homedir();
        const cwd = process.cwd();
        
        // Replace home directory with ~
        if (cwd.startsWith(homeDir)) {
          return cwd.replace(homeDir, '~');
        }
        return cwd;
      },
      '\\W': () => path.basename(process.cwd()),
      '\\$': () => process.getuid && process.getuid() === 0 ? '#' : '$',
      '\\n': () => os.EOL,
      '\\t': () => new Date().toLocaleTimeString(),
      '\\d': () => new Date().toLocaleDateString()
    };
  }

  formatPrompt() {
    let result = this.config.template;
    
    // Replace all symbols in the template with their values
    Object.entries(this.config.symbols).forEach(([symbol, getter]) => {
      // Escape the symbol for regex by escaping all special characters
      const escapedSymbol = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSymbol, 'g');
      try {
        result = result.replace(regex, getter());
      } catch (error) {
        console.error(`Error processing symbol ${symbol}:`, error);
      }
    });
    
    return result;
  }

  setTemplate(template) {
    this.config.template = template;
  }

  addSymbol(symbol, getter) {
    if (typeof getter !== 'function') {
      throw new Error('Symbol getter must be a function');
    }
    this.config.symbols[symbol] = getter;
  }
}

module.exports = PromptManager;