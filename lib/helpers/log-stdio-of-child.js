'use striiiict';

//core
const path = require('path');
const fs = require('fs');

//project
const sumanUtils = require('suman-utils/utils');

////////////////////////////////////////////////////////////////////////////////

module.exports = function (filePath) {

  if (true || process.env.MAKE_SUMAN_LOG === 'yes') {

    const f = path.resolve(global.sumanHelperDirRoot + '/logs/tests/');

    if (process.env.SUMAN_SINGLE_PROCESS) {
      console.log('oh well');
    }
    else {

      const temp = sumanUtils.removePath(filePath, global.projectRoot);

      const onlyFile = String(temp).replace(/\//g, '^');

      const strm = fs.createWriteStream(path.resolve(f + '/' + onlyFile + '.log'));
      const stderrWrite = process.stderr.write;

      process.stderr.write = function () {
        stderrWrite.apply(process.stderr, arguments);
        strm.write.apply(strm, arguments);
      };

      process.stderr.write(' => Beginning of stderr log for test with full path => ' + filePath);
    }

  }
};