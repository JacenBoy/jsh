const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class AliasManager {
  constructor(config = {}) {
    this.aliases = new Map();
    this.aliasFile = path.join(os.homedir(), '.jsh_aliases');
  }

  async loadAliases() {
    try {
      const data = await fs.readFile(this.aliasFile, 'utf8');
      const savedAliases = JSON.parse(data);
      
      // Convert the plain object to Map entries
      Object.entries(savedAliases).forEach(([key, value]) => {
        this.aliases.set(key, value);
      });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading aliases:', error.message);
      }
    }
  }

  async saveAliases() {
    try {
      // Convert Map to plain object for JSON serialization
      const aliasesObj = Object.fromEntries(this.aliases);
      await fs.writeFile(
        this.aliasFile,
        JSON.stringify(aliasesObj, null, 2)
      );
    } catch (error) {
      console.error('Error saving aliases:', error.message);
    }
  }

  setAlias(name, command) {
    this.aliases.set(name, command);
    this.saveAliases();
  }

  getAlias(name) {
    return this.aliases.get(name);
  }

  removeAlias(name) {
    const removed = this.aliases.delete(name);
    if (removed) {
      this.saveAliases();
    }
    return removed;
  }

  getAllAliases() {
    return this.aliases;
  }

  expandAlias(command) {
    const alias = this.aliases.get(command);
    return alias || command;
  }
}

module.exports = AliasManager;