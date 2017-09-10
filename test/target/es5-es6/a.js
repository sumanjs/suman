'use strict';

var suman = require('suman');
var Test = suman.init(module, {});

Test.describe(__filename, {}, function (assert) {

    this.before({ fatal: false }, function (t) {
        throw new Error('hook');
    });

    this.before(function (t) {
        console.log('before a');
    });

    this.beforeEach.cb({}, function (t) {
        console.log('before each starting...');
        setTimeout(function () {
            console.log('before each hook finished.');
            t.ctn();
        }, 100);
    });

    this.it('a', function (t) {
        assert(true);
    });

    this.after(function (t) {
        console.log('after a');
    });

    this.describe('nested group 1', function () {

        this.before(function (t) {
            console.log('before b');
        });

        this.it('b', function (t) {
            assert(true);
        });

        this.after(function (t) {
            console.log('after b');
        });

        this.describe('nested group 2', function () {

            this.before(function (t) {
                console.log('before c & d');
            });

            this.beforeEach(function (t) {
                console.log('before each of c & d');
            });

            this.it('c', function (t) {
                console.log('test passed');
                assert(true);
            });

            this.it('d', function (t) {
                assert(true);
            });

            this.after(function (t) {
                console.log('after c & d');
            });
        });
    });
});
