const fs = require('fs').promises;
const os = require('os');
const path = require('path');

class HistoryManager {
  constructor(config = {}) {
    this.maxHistory = config.maxHistory || 1000;
    this.historyFile = path.join(os.homedir(), '.jsh_history');
    this.history = [];
  }

  async loadHistory() {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      this.history = data.split('\n')
        .filter(line => line.trim()) // Remove empty lines
        .slice(-this.maxHistory); // Keep only the last maxHistory entries
      return this.history;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading history:', error.message);
      }
      return [];
    }
  }

  async saveHistory() {
    try {
      await fs.writeFile(this.historyFile, this.history.join('\n') + '\n');
    } catch (error) {
      console.error('Error saving history:', error.message);
    }
  }

  addCommand(command) {
    if (!command.trim()) return;

    // Don't add duplicate of the last command
    if (this.history[this.history.length - 1] !== command) {
      this.history.push(command);

      // Trim history if it exceeds maxHistory
      if (this.history.length > this.maxHistory) {
        this.history = this.history.slice(-this.maxHistory);
      }

      // Save history asynchronously
      this.saveHistory().catch(() => { });
    }
  }

  getHistory() {
    return this.history;
  }

  clear() {
    this.history = [];
    return this.saveHistory();
  }
}

module.exports = HistoryManager;