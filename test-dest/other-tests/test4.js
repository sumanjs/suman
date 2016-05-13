'use strict';

/**
 * Created by denman on 1/3/2016.
 */

var Test = require('../../lib').init(module, 'suman.conf.js');

Test.describe('desc', function () {

    this.before(function () {});

    var i = 1;

    this.beforeEach(function (t) {});

    this.beforeEach(function (t) {});

    this.describe(function () {

        this.beforeEach(function (t) {});

        this.describe(function () {});

        this.describe(function () {
            var _this = this;

            [1, 2, 3].forEach(function (val) {

                _this.it('makes>' + val, function (t) {

                    return Promise.all([new Promise(function (resolve) {
                        resolve('bob');
                    }), new Promise(function (resolve) {
                        resolve('woody');
                    })]).then(function () {
                        //throw new Error('mike');
                    });
                });
            });
        });

        this.afterEach(function (t) {

            delete t.data;
        });
    });

    this.afterEach(function (t) {});

    this.afterEach(function (t) {});
});