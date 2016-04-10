const suman = require('../../lib');
var Test = suman.init(module, {
    interface: 'TDD'
});


function promiseTimeout() {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(3);
        }, 100);
    });
}

const testStream = require('../helpers/test-stream');


Test.suite('@Test1', {parallel: false, bail: true}, function (fs, path, stream) {


    const expected = [
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1',
        '@Test1'
    ];


    const strm = new stream.Readable({
        read: function (size) {

        }
    });

    const writable = testStream(expected);
    strm.pipe(writable);


    this.setupTest(function () {
        strm.push(this.desc + '\n');
    });

    this.teardownTest(function () {
        strm.push(this.desc + '\n');
    });

    this.setup(function () {
        strm.push(this.desc + '\n');
    });

    this.teardown(function () {
        strm.push(this.desc + '\n');
    });


    this.test('one', t => {
        return promiseTimeout(t);
    });


    this.suite('hello', {}, function () {


        this.test('two');


        this.test('three', t => {
            return promiseTimeout(t);
        });


        this.test('four', (t) => {
            return promiseTimeout(t);
        });


        this.test('five', t => {
            throw new Error('fools');
            return promiseTimeout(t);
        });

        this.suite(function () {

            this.test('four', (t) => {
                return promiseTimeout(t);
            });


            this.test('five', t => {
                return promiseTimeout(t);
            });

        });


    })


});
