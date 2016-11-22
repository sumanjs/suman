'use striiict';

//core
const path = require('path');
const fs = require('fs');
const assert = require('assert');

//npm
const colors = require('colors/safe');

//project

var loaded;

///////////////////////////////////////////////////////////////////

module.exports = function (sumanConfig, projectRoot) {

  if (loaded) {
    return loaded;
  }

  if (global.sumanOpts.init) {
    return loaded = {};
  }

  var sumanHelpersDir = global.sumanHelperDirRoot =path.resolve(projectRoot + '/' + (sumanConfig.sumanHelpersDir || 'suman'));
  var sumanHelpersDirLocated = false;

  try {
    fs.statSync(sumanHelpersDir);
    sumanHelpersDirLocated = true;
  }
  catch (err) {
    console.error('\n\n', colors.magenta('=> Suman could not locate your suman-helpers-dir, ' +
        'perhaps you need to update your suman.conf.js file,\n please see: ') + colors.cyan('oresoftware.github.io/suman/conf.html')
      + '\n' + err.stack + '\n');
    if (global.sumanOpts.strict) {
      process.exit(constants.EXIT_CODES.COULD_NOT_LOCATE_SUMAN_HELPERS_DIR);
    }
    else {
      sumanHelpersDir = global.sumanHelperDirRoot = path.resolve(projectRoot + '/suman-' + Date.now());
      fs.mkdirSync(sumanHelperDirRoot);
      fs.writeFileSync(sumanHelperDirRoot + '/.readme-immediately', 'This (temporary) directory was created because you have yet to ' +
        'create a suman helpers directory,\nor it was deleted. When running "suman --init", a directory called "suman" is created at the ' +
        'root of your project.\nYou can move this directory as desired, as long as you update suman.conf.js accordingly.\nPlease see these instructions on how to remedy the situation:\n' +
        '=> http://oresoftware.github.io/suman/init.html');
    }
  }

  // const logDir = path.resolve(global.sumanHelperDirRoot + '/logs');
  const logDir = path.resolve(sumanHelpersDir + '/logs');
  const integPrePath = path.resolve(sumanHelpersDir + '/suman.once.pre.js');
  const integPostPath = path.resolve(sumanHelpersDir + '/suman.once.post.js');

  //TODO possibly reconcile these with cmd line options
  process.env.TEST_DIR = path.resolve(projectRoot + '/' + (sumanConfig.testDir || 'test'));
  process.env.TEST_SRC_DIR = path.resolve(projectRoot + '/' + (sumanConfig.testSrcDir || 'test/test-src'));
  process.env.TEST_TARGET_DIR = path.resolve(projectRoot + '/' + (sumanConfig.testTargetDir || 'test/test-target'));

  assert(sumanHelpersDir === global.sumanHelperDirRoot,
    colors.red(' => Suman implementation error => global does not match local variable =>' +
      ' \n global => "' + global.sumanHelperDirRoot + '"' +
      ' \n local => "' + sumanHelpersDir + '"'));

  const errStrmPath = path.resolve(sumanHelpersDir + '/logs/test-debug.log');
  const strmStdoutPath = path.resolve(sumanHelpersDir + '/logs/test-output.log');

  return loaded = Object.freeze({
    sumanHelpersDir: global.sumanHelperDirRoot = sumanHelpersDir,
    sumanLogDir: global.sumanLogDir = logDir,
    integPrePath: global.integPrePath = integPrePath,
    integPostPath: global.integPostPath = integPostPath,
    sumanHelpersDirLocated: sumanHelpersDirLocated,
    testDebugLogPath: errStrmPath,
    testLogPath: strmStdoutPath
  });

};