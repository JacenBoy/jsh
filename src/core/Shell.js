const readline = require('readline');
const CommandExecutor = require('../commands/CommandExecutor');
const InputHandler = require('../input/InputHandler');
const PromptManager = require('../utils/PromptManager');
const ConfigManager = require('../utils/ConfigManager');

class Shell {
  constructor(config = {}) {
    this.configManager = new ConfigManager();
    this.inputHandler = new InputHandler();
    this.commandExecutor = new CommandExecutor(this);
    this.promptManager = new PromptManager();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ''
    });
  }

  async init() {
    await this.loadConfig();
    await this.setupShell();
  }

  async setupShell() {
    // Update prompt when directory changes
    const updatePrompt = () => {
      this.rl.setPrompt(this.promptManager.formatPrompt());
      this.rl.prompt(true);
    };

    // Watch for directory changes
    process.on('directory-change', updatePrompt);

    this.rl.on('line', async (line) => {
      const input = this.inputHandler.parseLine(line);
      const success = await this.commandExecutor.execute(input);
      
      // Update prompt after each command
      updatePrompt();
    });

    this.rl.on('close', () => {
      console.log('\nGoodbye!');
      process.exit(0);
    });

    // Set initial prompt
    updatePrompt();
  }

  async loadConfig() {
    const config = await this.configManager.load();
    if (config.prompt?.template) {
      this.promptManager.setTemplate(config.prompt.template);
    }
  }

  async setPromptTemplate(template) {
    this.promptManager.setTemplate(template);
    this.configManager.set('prompt', 'template', template);
    await this.configManager.save();
    
    this.rl.setPrompt(this.promptManager.formatPrompt());
    this.rl.prompt(true);
  }

  async start() {
    this.rl.prompt();
  }
}

module.exports = Shell;