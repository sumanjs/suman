/**
 * Created by Olegzandr on 6/14/16.
 */


//core
const path = require('path');
const fs = require('fs');
const assert = require('assert');
const util = require('util');

//npm
const colors = require('colors/safe');
const _ = require('lodash');

//project
const resultBroadcaster = global.resultBroadcaster = global.resultBroadcaster || new EE();

//these are defined at top of ./index.js
const matchesAny = global.sumanMatchesAny;
const matchesNone = global.sumanMatchesNone;
const matchesAll = global.sumanMatchesAll;

assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');
assert(Array.isArray(matchesNone), ' => Suman internal error => matchesNone is not defined as array type.');
assert(Array.isArray(matchesAll), ' => Suman internal error => matchesAll is not defined as array type.');

/////////////////////////////////////////////

module.exports = function getFilePaths (dirs) {

  if (global.sumanOpts.verbose || process.env.SUMAN_DEBUG === 'yes') {
    console.log(' => Test files will be run if they match any of:', matchesAny);
    console.log(' => But test files will *not* run if they match any of:', matchesNone);
    console.log(' => Test files will *not* run if they don\'t match all of:', matchesAll);
  }

  const files = [];
  const filesThatDidNotMatch = files.filesThatDidNotMatch = [];

  function doesMatchAll (filename) {
    return matchesAll.every(function (regex) {
      const val = String(filename).match(regex);
      if (!val) {
        filesThatDidNotMatch.push({
          filename: filename,
          regexType: 'matchAll',
          regex: 'The filename did not match the following regex' +
          ' and therefore was excluded => ' + [ regex ],
        });
      }
      return val;
    });
  }

  function doesMatchAny (filename) {   // we return true if filename matches any regex
    const val = !matchesAny.every(function (regex) {
      return !String(filename).match(regex);
    });

    if (!val) {
      filesThatDidNotMatch.push({
        filename: filename,
        regexType: 'matchAny',
        regex: 'The filename did not match any of the following regex(es) => '
        + matchesAny.map(i => i.toString().slice(1, -1))
      });
    }

    return val;
  }

  function doesMatchNone (filename) { // we return true if filename matches any regex
    return matchesNone.every(function (regex) {
      const val = !String(filename).match(regex);
      if (!val) {
        filesThatDidNotMatch.push({
          filename: filename,
          regexType: 'matchNone',
          regex: 'The filename matched the following regex and was therefore excluded => ' + [ regex ],

        });
      }
      return val;
    });
  }

  dirs.forEach(function (dir) {

    (function getAllFiles (dir, isFile) {

      if (!path.isAbsolute(dir)) {
        dir = path.resolve(root + '/' + dir); //TODO fix this path?
      }
      //else {
      // TODO: handle "absolute" dirs correctly
      //    console.log('You have passed an absolute file or directory:', dir);
      //}

      var stat;

      if (isFile === true || ((stat = fs.statSync(dir)) && stat.isFile())) {

        const baseName = path.basename(dir);

        if (path.extname(baseName) !== '.js') {
          resultBroadcaster.emit('filename-not-js-file',
            '\n => You may have wanted to run the file with this name:' + dir + ', but it is not a .js file\n');
          return;
        }

        const _doesMatchAny = doesMatchAny(dir);
        const _doesMatchNone = doesMatchNone(dir);
        const _doesMatchAll = doesMatchAll(dir);

        if (!_doesMatchAny) {
          resultBroadcaster.emit('filename-not-match-any', '\n => You may have wanted to run file with this name:' + dir + ', ' +
            'but it didnt match the regex(es) you passed in as input for "matchAny".');
          return;
        }

        if (!_doesMatchNone) {
          resultBroadcaster.emit('filename-not-match-none', '\n => You may have wanted to run file with this name:' + dir + ', ' +
            'but it didnt match the regex(es) you passed in as input for "matchNone".');
          return;
        }

        if (!_doesMatchAll) {
          resultBroadcaster.emit('filename-not-match-all', '\n => You may have wanted to run file with this name:' + dir + ',' +
            ' but it didnt match the regex(es) you passed in as input for "matchAll"');

          return;
        }

        const file = path.resolve(dir);
        if (_.includes(files, file)) {
          console.log(colors.magenta(' => Suman warning => \n => The following filepath was requested to be run more' +
            ' than once, Suman will only run files once per run! =>'), '\n', file, '\n\n');
        }
        else {
          files.push(file);
        }

      }

      else {

        try {
          stat = stat || fs.statSync(dir);
        }
        catch (err) {
          console.log(err.stack);
          return;
        }

        fs.readdirSync(dir).forEach(function (file) {

          const fileName = String(file);

          file = path.resolve(dir + '/' + file);

          var stat;

          try {
            stat = fs.statSync(file)
          }
          catch (err) {
            console.error(err.stack);
            return;
          }

          if (stat.isFile() && path.extname(file) === '.js') {
            getAllFiles(file, true);
          }
          else if (stat.isDirectory() && global.sumanOpts.recursive) {
            getAllFiles(file, false);
          }
          else {

              const msg = [
                '\n\t => Suman message => You wanted to run the file with this path:',
                colors.cyan(String(file)),
                '...but it is either a folder or is not a .js file',
                'if you want to run *subfolders* you shoud use the recursive option -r',
                '...be sure to only run files that constitute Suman tests, to enforce this we',
                'recommend a naming convention to use with Suman tests, see: oresoftware.github.io/suman\n\n'
              ].filter(i => i).join('\n');

              resultBroadcaster.emit('runner-directory-no-recursive',msg);

          }

        });
      }

    })(dir)
  });

  return files;
};