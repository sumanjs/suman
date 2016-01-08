/**
 * Created by amills001c on 12/1/15.
 */



var incr = require('./incrementer');

function makeLoopTestSet(suman){

    function LoopTestSet() {
        this.testId = incr();
        this.tests = [];
        this.type = 'LoopTestSet';
        this.parallel = true;
    }

    LoopTestSet.prototype.it = function (desc, opts, cb) {

        if(typeof desc !== 'string'){
            throw new Error('first argument to this.it() must be a string');
        }

        if(typeof opts === 'function'){
            cb = opts;
            opts = {};
        }
        else if(typeof opts !== 'object'){
            throw new Error('opts is not an object');
        }

        this.tests.push({
            testId: incr(),
            type: 'it-loop',
            opts: opts,
            desc: desc,
            data: {},
            cb: cb,
            timedOut: false,
            complete: false,
            error: null
        });
        return this;
    };

    LoopTestSet.prototype.log = function (data) {
        suman.log(data, this);
    };

    return LoopTestSet;

}


module.exports = makeLoopTestSet;