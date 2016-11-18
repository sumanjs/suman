'use striiiict';

//core
const util = require('util');
const path = require('path');

//npm
const colors = require('colors/safe');

//project
const sumanUtils = require('suman-utils/utils');


/////////////////////////////////////////////////////


module.exports = Object.freeze({

    allDoneHere: function(cmdArray){
      console.log('\n\n', ' => All done here! The valid Suman command to run is =>');
      console.log('  => ', colors.magenta.bold(cmdArray.join(' ')));
      console.log('\n');
      process.exit(0);
    },

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
        if(!path.isAbsolute(p)){
           return p;
        }
        return sumanUtils.removePath(p, global.projectRoot);
      }).join(' ');
    }

});