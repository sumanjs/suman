'use strict';

var _lib = require('../../lib');

var suman = _interopRequireWildcard(_lib);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var Test = suman.init(module);

Test.describe('a', function (assert, fs) {

        this.describe('b', function () {

                this.it('a', function (t, done) {

                        done();
                });

                this.it('a', function (t) {});
        });
});