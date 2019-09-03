const electron = require('electron');
const Docker = require('./docker');

function wait(n) {
  return function(...args) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(...args)
      }, n * 1000)
    });
  }
}

const config = {
  docker: {
    command: 'docker',
    subCommand: 'run',
    image: 'continuumio/anaconda3:2019.03',
    port: {
      src: 8888,
      dest: 8888,
    },
    opts: {
      name: 'jupyter-app',
      detach: true,
      init: true,
      publish: [],
      volume: [
        '$HOME:/notebooks',
        '$(pwd)/shortcuts.json:/root/.jupyter/lab/user-settings/@jupyterlab/shortcuts-extension/plugin.jupyterlab-settings',
      ],
    },
  },
  container: {
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
config.docker.opts.publish.push(`${config.docker.port.src}:${config.docker.port.dest}`);

const jupyter = new Docker.Container(config.docker.opts.name, config);

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
    window.loadURL(`http://localhost:${config.docker.port.src}/`);
  }).catch((e) => {
    console.error(e);
    electron.app.quit();
  });
});

electron.app.on('quit', () => jupyter.stop());