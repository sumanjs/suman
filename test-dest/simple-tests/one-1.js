'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/**
 * Created by denmanm1 on 4/13/16.
 */

var suman = require('../../lib');
var Test = suman.init(module);

Test.describe('SimpleTest', function (assert, fs, http, os) {
    var _this = this;

    this.it('tests-arrays', function () {
        assert.equal(_typeof([]), 'object');
    });

    ['describe', 'it', 'before', 'after', 'afterEach'].forEach(function (item) {

        _this.it('tests-suman suite block for: ' + item, function () {
            assert(this.hasOwnProperty(item));
        });
    });

    this.it.cb('Check that Test.file is equiv. to module.filename', { timeout: 20 }, function (t) {
        setTimeout(function () {
            assert(module.filename === Test.file);
            t.done();
        }, 19);
    });

    this.it.cb('reads this file, pipes to /dev/null', function (t) {

        var destFile = os.hostname === 'win32' ? process.env.USERPROFILE + '/temp' : '/dev/null';

        fs.createReadStream(Test.file).pipe(fs.createWriteStream(destFile)).on('error', t.fail).on('finish', t.pass);
    });

    this.it('uses promises to handle http', { timeout: 4000 }, function () {

        return new Promise(function (resolve, reject) {

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