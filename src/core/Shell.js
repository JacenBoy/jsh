const readline = require('readline');
const CommandExecutor = require('../commands/CommandExecutor');
const InputHandler = require('../input/InputHandler');
const CompletionHandler = require('../input/CompletionHandler');
const PromptManager = require('../utils/PromptManager');
const ConfigManager = require('../utils/ConfigManager');
const HistoryManager = require('../utils/HistoryManager');
const EnvironmentManager = require('../utils/EnvironmentManager');

class Shell {
  constructor(config = {}) {
    this.configManager = new ConfigManager();
    this.inputHandler = new InputHandler(this);
    this.completionHandler = new CompletionHandler();
    this.commandExecutor = new CommandExecutor(this);
    this.environmentManager = new EnvironmentManager();
    this.promptManager = new PromptManager();
  }

  async init() {
    this.config = await this.loadConfig();

    await this.environmentManager.loadPersistentVars();

    if (this.config.prompt?.template) {
      this.promptManager.setTemplate(this.config.prompt.template);
    }
    this.historyManager = new HistoryManager(this.config.history);

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
      completer: (line) => this.completionHandler.complete(line, process.cwd()),
      historySize: this.config.history?.maxHistory || 1000
    });

    await this.setupShell();
  }

  async setupShell() {
    const history = await this.historyManager.loadHistory();
    this.rl.history = [];
    [...history].reverse().forEach(cmd => this.rl.history.push(cmd));

    // Update prompt when directory changes
    const updatePrompt = () => {
      this.rl.setPrompt(this.promptManager.formatPrompt());
      this.rl.prompt(true);
    };

    // Watch for directory changes
    process.on('directory-change', updatePrompt);

    this.rl.on('line', async (line) => {
      const trimmedLine = line.trim();

      if (trimmedLine) {
        // Add command to history
        this.historyManager.addCommand(trimmedLine);
      }

      const input = this.inputHandler.parseLine(line);
      const success = await this.commandExecutor.execute(input);

      // Update prompt after each command
      updatePrompt();
    });

    this.rl.on('close', () => {
      // Save history before exiting
      this.historyManager.saveHistory()
        .finally(() => {
          //console.log('\nGoodbye!');
          process.exit(0);
        });
    });

    this.rl.on('SIGINT', () => {
      if (this.rl.line.length > 0) {
        // Clear the current line if there's content
        console.log('^C');
        this.rl.line = '';
        this.rl.prompt();
      } else {
        // Exit if Ctrl+C is pressed on an empty line
        this.rl.close();
      }
    });

    // Set initial prompt
    updatePrompt();
  }

  async loadConfig() {
    const config = await this.configManager.load();
    return config;
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