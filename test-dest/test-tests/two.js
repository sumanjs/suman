'use strict';

var suman = require('../../lib');
var Test = suman.init(module, {});

Test.describe('root suite description', {}, function () {
    var _this = this;

    // we define the root suite

    //note: we are in the context of the "root suite"

    var self = this; // (avoid the self pattern in Suman tests, here for explanation only :)

    this.before.cb(function (t) {
        console.log('1', _this === self); //true
        t.done();
    });

    this.beforeEach.cb(function (t) {
        console.log('2', this === self); //true
        t.ctn();
    });

    this.it(function (t) {
        console.log('3', this === self); //true
        t.log('whooooa');
    });

    this.describe('child suite A', {}, function () {
        var _this2 = this;

        //calling 'this.describe' creates a child suite

        console.log('4', this.parent.title === 'root suite description'); // true

        var that = this; //we have a new context, and the new context is this child suite A

        console.log('5', that !== self); // true

        this.before(function () {
            console.log('6', this === that); //true
        });

        this.beforeEach(function () {
            console.log('7', _this2 === that); //true
        });

        this.it(function () {
            console.log('8', this === that); //true
        });

        this.describe('child suite B', {}, function () {
            var _this3 = this;

            //calling 'this.describe' creates a child suite

            var ctx = this; //we have a new context, and the new context is this child suite B

            console.log('9', this.parent.title === 'child suite A'); // true
            console.log('10', ctx !== that && ctx !== self); // true

            this.before(function () {
                console.log('11', this === ctx); //true
            });

            this.beforeEach(function () {
                console.log('12', this === ctx); //true
            });

            this.it(function () {
                console.log('13', _this3 === ctx); //true
            });
        });
    });
});