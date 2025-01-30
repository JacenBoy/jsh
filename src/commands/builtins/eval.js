class Eval {
  constructor() {

  }

  async execute(input) {
    const args = input.rawArgs;

    try {
      const result = eval(args);
      return console.log(result);
    } catch (ex) {
      return console.error(ex.message);
    }
  }
}

module.exports = Eval;