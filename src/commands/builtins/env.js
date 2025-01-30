class Env {
  constructor(shell) {
    this.shell = shell;
  }

  async execute(input) {
    const args = input.args;
    const envManager = this.shell.environmentManager;

    // Handle different command formats:
    // env                     - List all environment variables
    // env NAME=VALUE         - Set environment variable (session only)
    // env -p NAME=VALUE      - Set persistent environment variable
    // env -u NAME            - Unset environment variable
    // env NAME               - Get specific environment variable
    // env -l                 - List only persistent variables

    if (args.length === 0) {
      // List all environment variables
      const env = envManager.getAll();
      Object.entries(env).sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([key, value]) => {
          const persistent = envManager.isPersistent(key) ? '(P) ' : '    ';
          console.log(`${persistent}${key}=${value}`);
        });
      return true;
    }

    if (args[0] === '-l') {
      // List only persistent variables
      const env = envManager.getAll();
      Object.entries(env)
        .filter(([key]) => envManager.isPersistent(key))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([key, value]) => {
          console.log(`${key}=${value}`);
        });
      return true;
    }

    if (args[0] === '-u' && args[1]) {
      // Unset environment variable
      envManager.unset(args[1]);
      return true;
    }

    const persistent = args[0] === '-p';
    const assignmentArg = persistent ? args[1] : args[0];

    // Check for NAME=VALUE format
    const assignment = assignmentArg?.match(/^([^=]+)=(.*)$/);
    if (assignment) {
      const [, name, value] = assignment;
      envManager.set(name, value, persistent);
      return true;
    }

    // Get specific environment variable
    if (!persistent && args[0]) {
      const value = envManager.get(args[0]);
      if (value !== undefined) {
        const persistentMark = envManager.isPersistent(args[0]) ? ' (persistent)' : '';
        console.log(`${value}${persistentMark}`);
        return true;
      }
    }

    console.error('Usage: env [-p] [-u name] [name=value] [name] [-l]');
    console.error('  -p: make the variable persistent across shell sessions');
    console.error('  -u: unset a variable');
    console.error('  -l: list only persistent variables');
    return false;
  }
}

module.exports = Env;