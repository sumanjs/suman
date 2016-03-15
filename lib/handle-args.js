/**
 * Created by denman on 12/28/15.
 */



function handleArgs(suman) {

    if (process.argv.indexOf('--grep-suite') !== -1) { //does our flag exist?
        var grepSuite = process.argv[process.argv.indexOf('--grep-suite') + 1]; //grab the next item
        if (grepSuite && String(grepSuite).length > 0) {
            suman.grepSuite = new RegExp(grepSuite);
        }
        else {
            process.send({errors: [], msg: 'bad --grep-suite option passed to suite', type: 'FATAL', fatal: true});
            console.error(new Error('bad --grep-suite option passed to suite'));
            process.exit(0);
        }
    }

    if (process.argv.indexOf('--runner') !== -1) { //does our flag exist?
        suman.usingRunner = true;
    }
}

module.exports = handleArgs;