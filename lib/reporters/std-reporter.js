'use striiiict';

const util = require('util');



function noop(){}

function logDebug(){
    var debug;
    if(debug = process.env.SUMAN_DEBUG === 'yes'){
        const args = Array.prototype.slice.call(arguments).filter(i => i);
        args.forEach(function(a){
            process.stderr.write(typeof a === 'string' ? a : util.inspect(a));
        });
    }
    return debug;
}

function onAnyEvent(data, value){
    if(!logDebug.apply(null,arguments)){
        process.stdout.write(data);
    }
}

function onVerboseEvent(data,value){
    if(!logDebug.apply(null,arguments)){
        if (global.sumanOpts.verbose) {
            process.stdout.write(data);
        }
    }
}

function onError(data,value){
    if(!logDebug.apply(null,arguments)){
        process.stderr.write(data);
    }
}


module.exports = s => {


    s.on('filename-not-js-file',onAnyEvent);
    s.on('filename-not-match-any', onVerboseEvent);
    s.on('filename-not-match-none', onVerboseEvent);
    s.on('filename-not-match-any', onVerboseEvent);
    s.on('runner-directory-no-recursive', onVerboseEvent);

    s.on('runner-initial-set',onAnyEvent);
    s.on('runner-overall-set',onAnyEvent);
    s.on('runner-ascii-logo',onAnyEvent);

    s.on('runner-start', onAnyEvent);
    s.on('runner-end', onAnyEvent);
    s.on('suite-skipped', onAnyEvent);
    s.on('suite-end',onAnyEvent);
    s.on('test-end', onAnyEvent);
    s.on('test-case-fail', onAnyEvent);
    s.on('test-case-pass', onAnyEvent);
    s.on('test-case-skipped', onAnyEvent);
    s.on('test-case-stubbed', onAnyEvent);

    s.on('exit-code-greater-than-zero',onError);
    s.on('exit-code-is-zero',noop);


};