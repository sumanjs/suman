/**
 * Created by amills001c on 11/25/15.
 */


function ParallelTestSet() {
    this.tests = [];
}

ParallelTestSet.prototype.it = function (desc, cb) {
    this.tests.push({
        testId: 555,
        desc: desc,
        cb: cb,
        complete: false,
        error: null
    });
    return this;
};


module.exports = ParallelTestSet;