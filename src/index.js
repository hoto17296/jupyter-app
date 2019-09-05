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
  config.docker.opts.publish.push(`${config.docker.port.src}:${config.docker.port.dest}`);
  const shortcutConfigPath = '/root/.jupyter/lab/user-settings/@jupyterlab/shortcuts-extension/shortcuts.jupyterlab-settings';
  config.docker.opts.volume.push(`${__dirname}/shortcuts.json:${shortcutConfigPath}:ro`);

  const jupyter = new Docker.Container(config.docker.opts.name, config);

  jupyter.start().then(wait(3)).then(() => jupyter.checkContainerExists()).then((success) => {
    if (!success) throw new Error(`Failed to start Jupyter.\nFor details, exec "docker logs ${jupyter.name}".`);
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

  electron.app.on('quit', () => jupyter.stop());
});
