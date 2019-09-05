const child_process = require('child_process');
const { promisify } = require('util');
const buildCommand = require('./buildCommand');

const exec = promisify(child_process.exec);

class Container {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  async checkContainerExists(runningOnly=true) {
    const command = `docker ps ${runningOnly ? '' : '-a'} -q -f name='^${this.name}$'`;
    const { stdout, stderr } = await exec(command);
    return !!stdout;
  }

  async start() {
    console.log('Starting Container...');
    const command = await this.checkContainerExists(false)
      ? `docker start ${this.name}`
      : buildCommand(this.config);
    console.log('exec:', command);
    await exec(command);
  }

  async stop() {
    console.log('Stopping Container...');
    await exec('docker stop ' + this.name);
  }

  async getLabels() {
    const command = `docker inspect -f '{{json .Config.Labels}}' ${this.name}`;
    const { stdout, stderr } = await exec(command);
    return JSON.parse(stdout);
  }
}

module.exports = { Container };