const electron = require('electron');

electron.app.on('ready', () => {
  new electron.BrowserWindow();
});