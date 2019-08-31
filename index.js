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

const runOpts = {
  image: 'continuumio/anaconda3:2019.03',
  notebookDir: '$HOME',
  port: 8888,
};

function buildRunCommand(opts) {
  return `docker run --rm -d --init \
    -p ${opts.port}:8888 \
    -v ${opts.notebookDir}:/notebooks \
    -v $(pwd)/shortcuts.json:/root/.jupyter/lab/user-settings/@jupyterlab/shortcuts-extension/plugin.jupyterlab-settings \
    ${opts.image} \
    jupyter lab \
      --allow-root \
      --ip=0.0.0.0 \
      --LabApp.token='' \
      --notebook-dir=/notebooks`;
}

const jupyter = new Docker.Container(buildRunCommand(runOpts));

electron.app.on('ready', () => {
  jupyter.start().then(wait(3)).then(() => {
    const window = new electron.BrowserWindow({ fullscreen: true });
    window.loadURL(`http://localhost:${runOpts.port}/`);
  });
});

electron.app.on('before-quit', (event) => {
  const quit = electron.dialog.showMessageBoxSync({
    message: 'Are you sure you want to quit?',
    buttons: ['Quit', 'Cancel'],
  });
  if (quit == 1) {
    event.preventDefault();
  }
  else {
    jupyter.stop();
  }
});