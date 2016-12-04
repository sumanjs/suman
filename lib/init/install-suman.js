'use striiict';


//core
const cp = require('child_process');
const os = require('os');

//npm
const colors = require('colors/safe');
const chmodr = require('chmodr');

//project
const constants = require('../../config/suman-constants');
const sumanUtils = require('suman-utils/utils');


/////////////////////////////////////////////////////////////////////////////

module.exports = function (data) {

  const resolvedLocal = data.resolvedLocal;
  const pkgDotJSON = data.pkgDotJSON;
  const projectRoot = data.projectRoot;

  return function npmInstall(cb) {

    if (global.sumanOpts.no_install || resolvedLocal) {
      if (resolvedLocal) {
        console.log('\n\n');
        console.log(colors.magenta(' => Suman is already installed locally ( v' + pkgDotJSON.version + '),' +
          ' to install to the latest version on your own, use =>', '\n',
          ' "$ npm install -D suman@latest"'));
      }
      process.nextTick(cb);
    }
    else {
      const i = setInterval(function () {
        process.stdout.write('.');
      }, 500);

      if (os.platform() === 'win32') {
        console.log(' => Suman message => Installing suman locally...using "npm install -D suman"...');
        console.log(' => Suman message => This may take a while if you are on Windows, be patient.');

        cp.exec('cd ' + projectRoot + ' && npm install -D suman@latest', function (err, stdout, stderr) {

          clearInterval(i);

          var $err;

          if (err) {
            $err += err.stack + '\n';
            console.error(' => Suman installation error => ' + err.stack);
          }
          if (String(stderr).match(/error/i)) {
            $err += stderr + '\n';
            console.error(' => Suman installation error => ' + stderr);
          }
          if (String(stdout).match(/error/i)) {
            console.error(' => Suman installation error => ' + stdout);
          }

          cb(null, $err);
        });

      }
      else {

        console.log(' => Suman message => Installing suman locally...using "npm install -D suman"...');

        const s = cp.spawn('npm', ['install', '--only=production', '--loglevel=warn', '-D', 'suman@latest'], {
          cwd: projectRoot
        });

        // s.stdout.on('data', (data) => {
        //     console.log(String(data));
        // });

        var first = true;
        s.stderr.on('data', (data) => {
          if (first) {
            first = false;
            clearInterval(i);
            console.log('\n');
          }
          console.error(String(data));
        });

        s.on('close', (code) => {
          clearInterval(i);
          if (code > 0) {  //explicit for your pleasure
            cb(null, ' => Suman installation warning => NPM install script exited with non-zero code: ' + code + '.')
          }
          else {
            cb(null);
          }

        });
      }

    }

  }

};
