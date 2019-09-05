const fs = require('fs');
const electron = require('electron');
const deepmerge = require('deepmerge');
const Docker = require('./docker');
const { checkFileExists, wait } = require('./utils');
const configDefault = require('./config');

electron.app.on('ready', () => {
  const configDir = (process.env.XDG_CONFIG_HOME || process.env.HOME + '/.config') + '/jupyter-app';
  const configFile = configDir + '/config.json';
  fs.mkdirSync(configDir, { recursive: true });
  if (!checkFileExists(configFile)) fs.writeFileSync(configFile, '{}');
  const config = deepmerge(configDefault, require(configFile));
  // publish port
  config.docker.opts.publish.push(`${config.docker.port.src}:${config.docker.port.dest}`);
  // set shortcuts
  const shortcutConfigPath = '/root/.jupyter/lab/user-settings/@jupyterlab/shortcuts-extension/shortcuts.jupyterlab-settings';
  config.docker.opts.volume.push(`${__dirname}/shortcuts.json:${shortcutConfigPath}:ro`);
  // set token
  let token = config.container.opts['LabApp.token'];
  if (token === undefined) {
    token = Math.random().toString(32).substring(2); // not very secure
    config.container.opts['LabApp.token'] = token;
  }
  config.docker.opts.label.push(`JupyterLab.Token=${token}`);

  const jupyter = new Docker.Container(config.docker.opts.name, config);

  jupyter.start()
    .then(wait(3))
    .then(() => jupyter.checkContainerExists())
    .then((success) => {
      if (!success) throw new Error(`Failed to start Jupyter.\nFor details, exec "docker logs ${jupyter.name}".`);
      return jupyter.getLabels();
    })
    .then((labels) => {
      const window = new electron.BrowserWindow({ fullscreen: true });
      window.on('close', (event) => {
        const quit = !electron.dialog.showMessageBoxSync({
          message: 'Are you sure you want to quit?',
          buttons: ['Quit', 'Cancel'],
        });
        if (!quit) event.preventDefault();
      });
      const token = labels['JupyterLab.Token'];
      window.loadURL(`http://localhost:${config.docker.port.src}/?token=${token}`);
    })
    .catch((e) => {
      console.error(e);
      electron.app.quit();
    });

  electron.app.on('quit', () => jupyter.stop());
});
