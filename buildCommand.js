function buildOpts(opts) {
  const list = [];
  for (let key of Object.keys(opts)) {
    let val = opts[key];
    switch (typeof val) {
      case 'boolean':
        if (val) list.push(`--${key}`);
        break;
      case 'object':
        if (!Array.isArray(val)) throw new TypeError(`Unexpected value: ${key}`);
        for (let v of val) list.push(`--${key}=${v}`);
        break;
      default:
        list.push(`--${key}=${val}`);
    }
  }
  return list.join(' ');
}

function buildCommand(config) {
  return ` \
    ${config.docker.command} \
    ${config.docker.subCommand} \
    ${buildOpts(config.docker.opts)} \
    ${config.docker.image} \
    ${config.container.command} \
    ${config.container.subCommand} \
    ${buildOpts(config.container.opts)} \
  `.replace(/\s\s+/g, ' ').trim();
}

module.exports = buildCommand;