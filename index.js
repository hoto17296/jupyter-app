const electron = require('electron');
const Docker = require('./docker');
const buildCommand = require('./buildCommand');

function wait(n) {
  return function(...args) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(...args)
      }, n * 1000)
    });
  }
}

const port = 8888;
const config = {
  docker: {
    command: 'docker',
    subCommand: 'run',
    image: 'continuumio/anaconda3:2019.03',
    opts: {
      rm: true,
      detach: true,
      init: true,
      publish: [
        `${port}:8888`,
      ],
      volume: [
        '$HOME:/notebooks',
        '$(pwd)/shortcuts.json:/root/.jupyter/lab/user-settings/@jupyterlab/shortcuts-extension/plugin.jupyterlab-settings',
      ],
    },
  },
  jupyter: {
    command: '/opt/conda/bin/jupyter',
    subCommand: 'lab',
    opts: {
      'allow-root': true,
      'ip': '0.0.0.0',
      'LabApp.token': '',
      'notebook-dir': '/notebooks',
    },
  },
};

const jupyter = new Docker.Container(buildCommand(config));

electron.app.on('ready', () => {
  jupyter.start().then(wait(3)).then(() => {
    const window = new electron.BrowserWindow({ fullscreen: true });
    window.on('close', (event) => {
      const quit = !electron.dialog.showMessageBoxSync({
        message: 'Are you sure you want to quit?',
        buttons: ['Quit', 'Cancel'],
      });
      if (!quit) event.preventDefault();
    });
    window.loadURL(`http://localhost:${port}/`);
  });
});

electron.app.on('quit', () => jupyter.stop());