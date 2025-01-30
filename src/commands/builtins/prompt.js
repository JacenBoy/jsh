class Prompt {
  constructor(shell) {
    this.shell = shell;
  }

  async execute(input) {
    const args = input.args;
    
    if (args.length === 0) {
      console.log('Current prompt template:', this.shell.promptManager.config.template);
      console.log('\nAvailable symbols:');
      console.log('  \\u - Username');
      console.log('  \\h - Hostname');
      console.log('  \\w - Current working directory (with ~ for home)');
      console.log('  \\W - Current directory name only');
      console.log('  \\$ - # for root, $ for regular user');
      console.log('  \\t - Current time');
      console.log('  \\d - Current date');
      console.log('  \\n - New line');
      console.log('\nPrompt template is automatically saved to ~/.jshrc');
      return true;
    }

    const newTemplate = input.rawArgs;
    await this.shell.setPromptTemplate(newTemplate);
    return true;
  }
}

module.exports = Prompt;