//core
const path = require('path');
const util = require('util');

//npm
const sumanUtils = require('suman-utils/utils');

//project
const cwd = process.cwd();

module.exports = function (configPath) {

  const projectRoot = global.projectRoot = global.projectRoot || sumanUtils.findProjectRoot(cwd);

  var config, pth1, pth2;

  if (!(config = global.sumanConfig)) {

    if (process.env.SUMAN_CONFIG) {
      config = global.sumanConfig = JSON.parse(process.env.SUMAN_CONFIG);
      return;
    }

    try {
      pth1 = path.resolve(path.normalize(cwd + '/' + configPath));
      config = require(pth1); //TODO: allow for command line input of configPath
    }
    catch (err) {
      try {
        pth1 = null;  //force null for logging below
        pth2 = path.resolve(path.normalize(projectRoot + '/suman.conf.js'));
        config = require(pth2);
      }
      catch (err) {
        pth2 = null;
        throw new Error(' => Suman message => Warning - no configuration (suman.conf.js) ' +
          'found in the root of your project.\n  ' + (err.stack || err));
      }
    }

    if (pth1 || pth2) {
      if (global.sumanOpts.verbose || sumanUtils.isSumanDebug()) {
        console.log(' => Suman verbose message => Path of suman config used: ' + (pth1 || pth2), '\n',
          'Value of suman config => ', util.inspect(config));
      }
    }

    global.sumanConfig = config;
  }

  return config;
};