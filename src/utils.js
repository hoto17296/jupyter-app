const fs = require('fs');

function checkFileExists(path) {
  try {
    return fs.statSync(path).isFile();
  }
  catch (e) {
    if (e.code === 'ENOENT') return false;
    else throw e;
  }
}

function wait(n) {
  return function(...args) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(...args)
      }, n * 1000)
    });
  }
}

module.exports = { checkFileExists, wait };