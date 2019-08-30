const child_process = require('child_process');
const { promisify } = require('util');

const exec = promisify(child_process.exec);

class Container {
  constructor(runCommand) {
    this.runCommand = runCommand;
    this.containerId = null;
  }

  async start() {
    console.log('Starting Container...');
    const { stdout, stderr } = await exec(this.runCommand);
    this.containerId = stdout;
  }

  async stop() {
    if (!this.containerId) return;
    console.log('Stopping Container...');
    await exec('docker stop ' + this.containerId);
    this.containerId = null;
  }
}

module.exports = { Container };