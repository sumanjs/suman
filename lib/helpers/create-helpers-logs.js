/**
 * Created by Olegzandr on 11/7/16.
 */


const fs = require('fs');
const constants = require('../../config/suman-constants');

var loaded = false;
module.exports = function (sumanHelpersDir, logDir) {

  if (loaded) {
    return;
  }
  else {
    loaded = true;
  }

  try {
    fs.statSync(sumanHelpersDir);
  }
  catch (err) {
    console.error('=> Suman could not locate your suman-helpers-dir, ' +
      'perhaps you need to update your suman.conf.js file, please see: oresoftware.github.io/suman/conf.html \n' + err.stack);
    process.exit(constants.EXIT_CODES.COULD_NOT_LOCATE_SUMAN_HELPERS_DIR);
  }

  try {
    fs.statSync(logDir);
  }
  catch (err) {
    console.error('=> Suman could successfully locate your "sumanHelpersDir", but could not find the /logs directory, ' +
      '\nyou may have accidentally deleted it, suman will re-create one for you.');
    try {
      fs.mkdirSync(logDir);
    }
    catch (err) {
      console.error('Could not create logs directory in your sumanHelpersDir, please report this issue.');
      process.exit(constants.EXIT_CODES.COULD_NOT_CREATE_LOG_DIR);
    }

  }

};