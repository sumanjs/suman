/**
 * Created by denman on 1/4/16.
 */


const constants = require('../config/suman-constants');


process.on('uncaughtException', function (err) {


    if (global.usingRunner) {
        process.send({
            type: constants.runner_message_type.FATAL,
            data: {
                msg: ' => Suman => fatal error in suite with path="xxx"' +
                '\n (note: You will need to transpile your test files if you wish to use ES7 features)',
                error: err.stack
            }
        });
    }

    const item = '\n\n => Suman => Uncaught Exception => ' + err.stack;

    process.stderr.write(item);

    if (String(err.stack).match(/.suite is not a function/i)) {
        process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
            '\n\tsee oresoftware.github.io/suman\n\n');
    }
    else if (String(err.stack).match(/.describe is not a function/i)) {
        process.stderr.write('\n\n => Suman tip => You may be using the wrong test interface try TDD instead of BDD or vice versa;' +
            '\n\tsee oresoftware.github.io/suman\n\n');
    }

    process.stdout.write('\n\n');
    global.SUMAN_EXIT_CODE_FORCE = constants.EXIT_CODES.SUMAN_UNCAUGHT_EXCEPTION;


    process.stderr.on('drain',function(){
        process.exit(constants.EXIT_CODES.SUMAN_UNCAUGHT_EXCEPTION);
    });

    setImmediate(function(){
        setTimeout(function(){
            process.exit(constants.EXIT_CODES.SUMAN_UNCAUGHT_EXCEPTION);
        },200);
    });

    //note we need throw here, because otherwise tests may appear to timeout instead of actually throwing an error
    
    // if(global.sumanOpts.bail){
    //     process.exit(constants.EXIT_CODES.SUMAN_UNCAUGHT_EXCEPTION);
    // }

});




