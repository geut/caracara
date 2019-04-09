const CopyPlugin = require('copy-webpack-plugin');

module.exports = function override(config, env) {
  console.log('>> webpack config', config.plugins)

  config.plugins.push(
    new CopyPlugin(['node_modules/@wirelineio/automerge-worker/dist/umd/automerge.worker.js'])
  )

  return config;
}
