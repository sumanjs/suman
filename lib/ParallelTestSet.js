/**
 * Created by denman on 12/1/15.
 */


var incr = require('./incrementer');

function makeParallelTestSet(suman){

    function ParallelTestSet() {
        this.testId = incr();
        this.tests = [];
        this.type = 'ParallelTestSet';
        this.parallel = true;
    }


    ParallelTestSet.prototype.it = function (desc, opts, cb) {

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
            type: 'it-parallel',
            data: {},
            desc: desc,
            cb: cb,
            complete: false,
            timedOut: false,
            error: null
        });
        return this;
    };

    ParallelTestSet.prototype.log = function (data) {
        suman.log(data, this);
    };


    return ParallelTestSet;

}



module.exports = makeParallelTestSet;