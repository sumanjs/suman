/**
 * Created by denman on 2/15/16.
 */


const constants = require('../config/suman-constants');

process.on('uncaughtException', function (err) {

    if(typeof process.send === 'function'){
        process.send({
            type: constants.runner_message_type.FATAL,
            data: {
                msg: ' => Suman => fatal error in suite with path="' + filePath + '"' +
                '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
                error: err.stack
            }
        });

        console.error(err.stack);
    }

    console.log(' => Suman => Uncaught exception in your test =>', '\n', err.stack + '\n\n');
    process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
});

///////////////////////////////////////
debugger;
///////////////////////////////////////

const filePath = process.argv[process.argv.indexOf('--fp') + 1];

const domain = require('domain');
const d = domain.create();

d.once('error', function (err) {

    process.send({
        type: constants.runner_message_type.FATAL,
        data: {
            msg: ' => Suman => fatal error in suite with path="' + filePath + '"' +
            '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
            error: err.stack
        }
    });

    console.error(err.stack);
    process.exit(constants.EXIT_CODES.UNEXPECTED_FATAL_ERROR);
});

d.run(function () {
    process.nextTick(function () {
        require(filePath);
    });
});