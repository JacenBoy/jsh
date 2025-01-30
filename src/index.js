const Shell = require('./core/Shell');

async function main() {
  const jsh = new Shell();
  await jsh.init();
  jsh.start();
}

main().catch(error => {
  console.error('Shell initialization error:', error);
  process.exit(1);
});