//core
const path = require('path');

//project
const constants = require('../config/suman-constants');
const sumanUtils = require('./utils');

const usingRunner = global.usingRunner = true;
const root = global.projectRoot = sumanUtils.findProjectRoot(process.cwd());

process.on('uncaughtException', function (err) {

    process.send({
        type: constants.runner_message_type.FATAL,
        data: {
            msg: ' => Suman => fatal error in suite with path="' + filePath + '"' +
            '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
            error: err.stack
        }
    });

    console.log(' => Suman => Uncaught exception in your test =>', '\n', (err.stack || err) + '\n\n');

    if (String(err.stack || err).match(/Cannot find module/i) && global.sumanOpts && global.sumanOpts.transpile) {
        console.log(' => If transpiling, you may need to transpile your entire test directory to the destination directory using the ' +
            '--transpile and --all options together.')
    }

    // process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
});

///////////////////////////////////////
debugger;
///////////////////////////////////////

const babelarg = process.argv.indexOf('--register') > -1;
const filePath = process.env.SUMAN_CHILD_TEST_PATH;
const sumanConfig = global.sumanConfig = JSON.parse(process.env.SUMAN_CONFIG);
const sumanHelperDirRoot = global.sumanHelperDirRoot = path.resolve(root + '/' + (sumanConfig.sumanHelpersDir || 'suman'));

//////////////////////////////////////////////////////////

const register = global.useBabelRegister = (process.argv.indexOf('--use-babel-register') > -1);

if (register) {

    require('babel-register')({
        // This will override `node_modules` ignoring - you can alternatively pass
        // an array of strings to be explicitly matched or a regex / glob
        // ignore: false
    });
}


if (babelarg) {
    require('babel-core/register')({
        ignore: /node_modules/
    });
}

////////////////////////////////////////////////////////

const singleProc = process.env.SUMAN_SINGLE_PROCESS === 'yes';

////////////////////////////////////////////////////////

const domain = require('domain');
const d = domain.create();

d.once('error', function (err) {

    process.send({
        type: constants.runner_message_type.FATAL,
        data: {
            msg: ' => Suman => fatal error in suite with path="' + filePath + '"',
            error: err.stack
        }
    });

    console.error(err.stack);
    process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR_DOMAIN_CAUGHT);
});

if (singleProc) {
    d.run(function () {
        //no filepath should ever have the * char
        require('./handle-single-proc')(JSON.parse(process.env.SUMAN_SINGLE_PROCESS_FILES));
    });
}
else {
    d.run(function () {
        process.nextTick(function () {
            require(path.resolve(sumanHelperDirRoot + '/suman.globals.js'));  //load globals
            require(filePath);
        });
    });
}

