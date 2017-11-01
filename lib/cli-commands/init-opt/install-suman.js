'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var process = require('suman-browser-polyfills/modules/process');
var global = require('suman-browser-polyfills/modules/global');
var cp = require('child_process');
var os = require('os');
var chalk = require("chalk");
var chmodr = require('chmodr');
var _suman = global.__suman = (global.__suman || {});
var constants = require('../../../config/suman-constants').constants;
var debug = require('suman-debug')('s:init');
exports.runNPMInstallSuman = function (resolvedLocal, pkgDotJSON, projectRoot) {
    return function npmInstall(cb) {
        if (_suman.sumanOpts.no_install || resolvedLocal) {
            if (resolvedLocal) {
                console.log('\n\n');
                _suman.log.info(chalk.magenta('Suman is already installed locally ( v' + pkgDotJSON.version + '),' +
                    ' to install to the latest version on your own, use =>', '\n', ' "$ npm install -D suman@latest"'));
            }
            process.nextTick(cb);
        }
        else {
            _suman.log.info('Installing suman locally...using "npm install -D suman"...');
            var sumanUrl = process.env.SUMAN_META_TEST === 'yes' ? 'github:sumanjs/suman#dev' : 'suman@latest';
            var s = cp.spawn('npm', ['install', '--production', '--only=production', '--loglevel=warn', '-D', sumanUrl], {
                cwd: projectRoot,
                env: Object.assign({}, process.env, {
                    SUMAN_POSTINSTALL_IS_DAEMON: _suman.sumanOpts.daemon ? 'yes' : undefined
                })
            });
            s.stdout.setEncoding('utf8');
            s.stderr.setEncoding('utf8');
            var i_1 = setInterval(function () {
                process.stdout.write('.');
            }, 500);
            s.stdout.on('data', function (d) {
                console.log(d);
            });
            var first_1 = true;
            s.stderr.on('data', function (d) {
                if (first_1) {
                    first_1 = false;
                    clearInterval(i_1);
                    console.log('\n\n');
                }
                console.error(String(d));
            });
            s.on('exit', function (code) {
                clearInterval(i_1);
                console.log('\n');
                console.error('\n');
                if (code > 0) {
                    cb(null, ' => Suman installation warning => NPM install script exited with non-zero code: ' + code + '.');
                }
                else {
                    cb(null);
                }
            });
        }
    };
};
