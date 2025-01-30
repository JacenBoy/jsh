const fs = require('fs').promises;
const path = require('path');
const os = require('os');

class EnvironmentManager {
  constructor() {
    this.env = { ...process.env };
    this.persistentEnvFile = path.join(os.homedir(), '.jsh_env');
    this.persistentVars = new Set(); // Track which variables should be persistent
  }

  async loadPersistentVars() {
    try {
      const data = await fs.readFile(this.persistentEnvFile, 'utf8');
      const savedVars = JSON.parse(data);

      // Restore saved variables
      Object.entries(savedVars).forEach(([key, value]) => {
        this.set(key, value);
        this.persistentVars.add(key);
      });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading persistent environment variables:', error.message);
      }
    }
  }

  async savePersistentVars() {
    try {
      const persistentEnv = {};
      for (const key of this.persistentVars) {
        if (this.env[key] !== undefined) {
          persistentEnv[key] = this.env[key];
        }
      }
      await fs.writeFile(
        this.persistentEnvFile,
        JSON.stringify(persistentEnv, null, 2)
      );
    } catch (error) {
      console.error('Error saving persistent environment variables:', error.message);
    }
  }

  findEnvVariable(name) {
    if (os.platform() === 'win32') {
      // On Windows, search case-insensitively
      const upperName = name.toUpperCase();
      return Object.keys(this.env).find(key => key.toUpperCase() === upperName);
    }
    return name;
  }

  get(name) {
    const actualName = this.findEnvVariable(name);
    return actualName ? this.env[actualName] : undefined;
  }

  set(name, value, persistent = false) {
    // On Windows, try to preserve existing capitalization
    const actualName = this.findEnvVariable(name) || name;

    this.env[actualName] = value;
    process.env[actualName] = value;

    if (persistent) {
      this.persistentVars.add(actualName);
      this.savePersistentVars();
    }
  }

  unset(name) {
    delete this.env[name];
    delete process.env[name];
    this.persistentVars.delete(name);
    this.savePersistentVars();
  }

  getAll() {
    return { ...this.env };
  }

  isPersistent(name) {
    return this.persistentVars.has(name);
  }

  expand(str) {
    return str.replace(/\$(\w+)|\$\{(\w+)\}/g, (match, name1, name2) => {
      const name = name1 || name2;
      return this.get(name) || '';
    });
  }
}

module.exports = EnvironmentManager;