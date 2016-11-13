'use striiiict';

//core
const util = require('util');

//project
const sumanUtils = require('suman-utils/utils');

module.exports = Object.freeze({

    mapSumanExec: function (exec, localOrGlobal) {

      _interactiveDebug(' => exec => ', exec, 'localOrGlobal =>', localOrGlobal);

      if (exec === 'suman') {
        if (localOrGlobal === 'local') {
          exec = './node_modules/.bin/' + exec;
        }
      }
      return exec;
    },

    mapDirs: function (pathsToRun) {
      return pathsToRun.map(function (p) {
        return sumanUtils.removePath(p, global.projectRoot);
      }).join(' ');
    }

});