const assert = require('assert');
const suman = require('C:\\Users\\denman\\WebstormProjects\\suman');

/////////////////////////////////////////////////////
var Test = suman.init(module);
/////////////////////////////////////////////////////


function promiseTimeout(t) {

    process.stdout.write('begin: ' + t.desc + '\n');

    return new Promise(function (resolve) {
        setTimeout(function () {
            process.stdout.write('end: ' + t.desc + '\n');
            resolve();
        }, Math.random() * 1000);
    })
}

Test.describe('@Test1', {parallel: true}, function (request,socketio) {


    this.it('one', t => {
        return promiseTimeout(t);
    });


    this.it('two', t => {
        return promiseTimeout(t);
    });

    this.it('three', t => {
        return promiseTimeout(t);
    });


    this.it('four', (t) => {
        return promiseTimeout(t);
    });


    this.it('five', t => {
        return promiseTimeout(t);
    });


});
