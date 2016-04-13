'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

        /*    this.describe(function(){
                 this.loop([1, 2, 3], function (val, index) {
                     this.it('makes' + val, function (t, done) {
                         setTimeout(function () {
                            done();
                        }, 500);
                     });
                 });
             });*/

        this.describe(function () {});

        this.describe(function () {
            var _this = this;

            [1, 2, 3].forEach(function (val) {

                _this.it('makes>' + val, function (t) {

                    return _promise2.default.all([new _promise2.default(function (resolve) {
                        resolve('bob');
                    }), new _promise2.default(function (resolve) {
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