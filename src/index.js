const fs = require('fs');
const electron = require('electron');
const contextMenu = require('electron-context-menu');
const deepmerge = require('deepmerge');
const Docker = require('./docker');
const { checkFileExists, checkDirExists, wait } = require('./utils');
const configDefault = require('./config');

// Show native context menu when hold down shift and right click.
contextMenu();

function buildConfig() {
  const configDir = (process.env.JUPYTER_CONFIG_DIR || process.env.HOME + '/.jupyter') + '/app';
  const configFile = configDir + '/config.json';
  fs.mkdirSync(configDir, { recursive: true });
  if (!checkFileExists(configFile)) fs.writeFileSync(configFile, '{}');
  const config = deepmerge(configDefault, require(configFile));

  // publish port
  config.docker.opts.publish.push(`127.0.0.1:${config.docker.port.src}:${config.docker.port.dest}`);

  // User settings
  const userSettingsHostPath = configDir + '/user-settings';
  const userSettingsContainerPath = '/home/jovyan/.jupyter/lab/user-settings';
  if (checkDirExists(userSettingsHostPath)) {
    config.docker.opts.volume.push(`${userSettingsHostPath}:${userSettingsContainerPath}`);
  }

  // set token
  let token = config.container.opts['LabApp.token'];
  if (token === undefined) {
    token = Math.random().toString(32).substring(2); // not very secure
    config.container.opts['LabApp.token'] = token;
  }
  config.docker.opts.label.push(`JupyterLab.Token=${token}`);

  return config;
}

const jupyter = new Docker.Container(buildConfig());

electron.app.on('ready', async () => {
  try {
    await jupyter.start();
    await wait(3);
    if (!await jupyter.checkContainerExists()) {
      throw new Error(`Failed to start Jupyter.\nFor details, exec "docker logs ${jupyter.name}".`);
    }
    const window = new electron.BrowserWindow({ fullscreen: true });
    window.on('close', (event) => {
      const quit = !electron.dialog.showMessageBoxSync({
        message: 'Are you sure you want to quit?',
        buttons: ['Quit', 'Cancel'],
      });
      if (!quit) event.preventDefault();
    });
    window.webContents.on('new-window', (event, url) => {
      event.preventDefault();
      electron.shell.openExternal(url);
    });
    const token = (await jupyter.getLabels())['JupyterLab.Token'];
    window.loadURL(`http://127.0.0.1:${jupyter.config.docker.port.src}/?token=${token}`);
  }
  catch (e) {
    console.error(e);
    electron.app.quit();
  }
});

electron.app.on('quit', () => jupyter.stop());
