/**
 * Created by denman on 12/28/15.
 */


//TODO: fix this

const constants = require('../config/suman-constants');

function handleArgs(suman) {

    if (process.argv.indexOf('--grep-suite') !== -1) { //does our flag exist?
        var grepSuite = process.argv[process.argv.indexOf('--grep-suite') + 1]; //grab the next item
        if (grepSuite && String(grepSuite).length > 0) {
            suman.grepSuite = new RegExp(grepSuite);
        }
        else {
            if (typeof process.send === 'function') {
                process.send({
                    errors: [],
                    msg: 'bad --grep-suite option passed to suite',
                    type: constants.runner_message_type.FATAL
                });
            }
            console.error(new Error('bad --grep-suite option passed to suite'));
            process.exit(constants.EXIT_CODES.BAD_GREP_SUITE_OPTION);
        }

    }

    if (process.argv.indexOf('--runner') !== -1) { //does our flag exist?
        suman.usingRunner = true;
    }
}

module.exports = handleArgs;