//core
const path = require('path');
const util = require('util');

//npm
const sumanUtils = require('suman-utils/utils');
const colors = require('colors/safe');

//project
const cwd = process.cwd();

/////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (configPath, opts) {

  // const init = opts.init;
  // const uninstall = opts.uninstall;
  //
  // var sumanConfig;
  //
  //
  // if (init) {
  //   global.usingDefaultConfig = true;
  //   sumanConfig = global.sumanConfig = {};
  // }
  // else {
  //   try {
  //     //TODO: There's a potential bug where the user passes a test path to the config argument like so --cfg path/to/test
  //     pth = path.resolve(configPath || (cwd + '/' + 'suman.conf.js'));
  //     sumanConfig = global.sumanConfig = require(pth);
  //     if (opts.verbose) {  //default to true
  //       console.log(' => Suman verbose message => Suman config used: ' + pth);
  //     }
  //
  //   }
  //   catch (err) {
  //
  //     console.log(colors.bgBlack.yellow(' => Suman warning => Could not find path to your config file in your current working directory or given by --cfg at the command line...'));
  //     console.log(colors.bgBlack.yellow(' => ...are you sure you issued the suman command in the right directory? ...now looking for a config file at the root of your project...'));
  //
  //     try {
  //       pth = path.resolve(projectRoot + '/' + 'suman.conf.js');
  //       sumanConfig = global.sumanConfig = require(pth);
  //       if (!opts.sparse) {  //default to true
  //         console.log(colors.cyan(' => Suman config used: ' + pth + '\n'));
  //       }
  //     }
  //     catch (err) {
  //
  //       if (!uninstall) {
  //         if (String(err.stack || err).match(/Cannot find module\.*suman\.conf\.js/)) {
  //           throw new Error(' => Suman message => Warning - no configuration (suman.conf.js) ' +
  //             'found in the root of your project.\n  ' + (err.stack || err));
  //         }
  //         else {
  //           throw new Error(colors.red(' => Suman usage error => There was an error loading your suman.conf.js file =>')
  //             + '\n ' + (err.stack || err));
  //         }
  //
  //       }
  //       else {
  //         // if we read in the default config, then package.json is not resolved correctly
  //         // we need to provide some default values though
  //         sumanConfig = global.sumanConfig = {
  //           sumanHelpersDir: 'suman'
  //         };
  //       }
  //
  //       // note that we used to use to fallback on default configuration, but now we don't anymore
  //     }
  //   }
  // }

  const projectRoot = global.projectRoot = (global.projectRoot || sumanUtils.findProjectRoot(cwd));

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
          'found in the root of your project.\n  ' + colors.magenta(err.stack || err) + '\n');
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