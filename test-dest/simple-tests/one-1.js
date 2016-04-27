'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by denmanm1 on 4/13/16.
 */

var suman = require('../../lib');
var Test = suman.init(module);

Test.describe('SimpleTest', function (assert, fs, http, os) {
    var _this = this;

    this.it('tests-arrays', function () {
        assert.equal((0, _typeof3.default)([]), 'object');
    });

    ['describe', 'it', 'before', 'after', 'afterEach'].forEach(function (item) {

        _this.it('tests-suman suite block for: ' + item, function () {
            assert(this.hasOwnProperty(item));
        });
    });

    this.it('Check that Test.file is equiv. to module.filename', { timeout: 20 }, function (done) {
        setTimeout(function () {
            assert(module.filename === Test.file);
            done();
        }, 19);
    });

    this.it('reads this file, pipes to /dev/null', function (fail, pass) {

        var destFile = os.hostname === 'win32' ? process.env.USERPROFILE + '/temp' : '/dev/null';

        fs.createReadStream(Test.file).pipe(fs.createWriteStream(destFile)).on('error', fail).on('finish', pass);
    });

    this.it('uses promises to handle http', { timeout: 4000 }, function () {

        return new _promise2.default(function (resolve, reject) {

            var req = http.request({

                method: 'GET',
                hostname: 'example.com'

            }, function (res) {

                var data = '';

                res.on('data', function (d) {
                    data += d;
                });

                res.on('end', function () {

                    assert(typeof data === 'string');
                    resolve();
                });
            });

            req.end();
            req.on('error', reject);
        });
    });
});