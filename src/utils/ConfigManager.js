const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configPath = path.join(os.homedir(), '.jshrc');
    this.config = {
      prompt: {
        template: '[\\u@\\h \\w]$ '
      },
      history: {
        maxHistory: 1000
      }
    };
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data);
      return this.config;
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.save();
        return this.config;
      }
      console.error('Error loading config:', error.message);
      return this.config;
    }
  }

  async save() {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving config:', error.message);
      return false;
    }
  }

  get(section, key) {
    if (key) {
      return this.config[section]?.[key];
    }
    return this.config[section];
  }

  set(section, key, value) {
    if (!this.config[section]) {
      this.config[section] = {};
    }
    this.config[section][key] = value;
  }
}

module.exports = ConfigManager;