const child_process = require('child_process');
const { promisify } = require('util');
const buildCommand = require('./buildCommand');

const exec = promisify(child_process.exec);

class Container {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  async checkContainerExists() {
    const { stdout, stderr } = await exec(`docker ps -a -q -f name='^${this.name}$'`);
    return !!stdout;
  }

  async start() {
    console.log('Starting Container...');
    const command = await this.checkContainerExists()
      ? `docker start ${this.name}`
      : buildCommand(this.config);
    console.log('exec:', command);
    await exec(command);
  }

  async stop() {
    console.log('Stopping Container...');
    await exec('docker stop ' + this.name);
  }
}

module.exports = { Container };