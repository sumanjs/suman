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
exports.makeNPMInstall = function (resolvedLocal, pkgDotJSON, projectRoot) {
    return function npmInstall(cb) {
        var sumanOpts = _suman.sumanOpts;
        if (!sumanOpts.install || sumanOpts.no_install || resolvedLocal) {
            if (resolvedLocal) {
                console.log('\n');
                _suman.log.info(chalk.magenta.bold("Suman is already installed locally ( v" + pkgDotJSON.version + " ).\n" +
                    "To install to the latest version on your own, use => '$ npm install -D suman@latest'"));
                console.log('\n');
            }
            return process.nextTick(cb);
        }
        var sumanUrl = process.env.SUMAN_META_TEST === 'yes' ? 'github:sumanjs/suman#dev' : 'suman@latest';
        var installOptsArray = ['install', '--production', '--only=production', '--loglevel=warn', '-D', sumanUrl];
        _suman.log.info("Installing suman locally...using \"npm " + installOptsArray.join(' ') + "\"...");
        console.log('\n');
        var s = cp.spawn('npm', installOptsArray, {
            cwd: projectRoot,
            env: Object.assign({}, process.env, {
                SUMAN_INIT_ROUTINE_NPM_INSTALL: 'yes'
            })
        });
        s.stdout.setEncoding('utf8');
        s.stderr.setEncoding('utf8');
        var i = setInterval(function () {
            process.stdout.write('.');
        }, 500);
        s.stdout.once('data', function (d) {
            _suman.log.info(d);
            clearInterval(i);
        });
        var first = true;
        s.stderr.on('data', function (d) {
            if (first) {
                first = false;
                clearInterval(i);
                _suman.log.info('\n\n');
            }
            _suman.log.warning(String(d));
        });
        s.once('exit', function (code) {
            clearInterval(i);
            _suman.log.info('\n');
            if (code > 0) {
                _suman.log.error(' => Suman installation warning => NPM install script exited with non-zero code: ' + code + '.');
            }
            cb(null);
        });
    };
};
