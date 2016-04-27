'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _suman = require('suman');

var suman = _interopRequireWildcard(_suman);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//es6 import syntax

var Test = suman.init(module, {
    interface: 'BDD' //BDD interface is default but are explicit
}); /**
     * Created by denman on 3/26/2016.
     */

function async(bool) {
    return function (target, key, descriptor) {
        descriptor.enumerable = value;
        return descriptor;
    };
}

// here we create the test suite, we can pass in core modules, and any value defined in suman.ioc.js
Test.describe('#Test1', function (assert, fs, http, path) {

    this.describe('tests multiplication', function () {
        var _this2 = this;

        this.beforeEach(function (t) {
            //this runs before any test case inside this describe block
            t.data.foo = 3;
        });

        this.it('[test] 1', function () {
            var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(t) {
                var bar, baz;
                return _regenerator2.default.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return new _promise2.default(function (resolve) {
                                    resolve('7');
                                });

                            case 2:
                                bar = _context.sent;
                                baz = bar * t.data.foo;

                                assert.equal(baz, 21);

                            case 5:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, _this2);
            })),
                _this = _this2;
            return function (_x) {
                return ref.apply(_this, arguments);
            };
        }());
    });

    this.describe('tests streams', function () {

        this.beforeEach(function (t) {
            //this runs before any test case inside this describe block
            t.data.srcDir = path.resolve(process.env.HOME + '/test_data');
        });

        //fail and pass are analagous to done('err') and done(null) respectively
        this.it('[test] 2', function (t, fail, pass) {

            fs.createReadStream(t.data.srcDir).pipe(fs.createWriteStream('/dev/null')).on('error', fail).on('finish', pass);
        });
    });

    this.describe('tests http request', function () {
        var _this3 = this;

        ['/foo', '/bar', '/bar'].forEach(function (val) {

            _this3.it('[test] 3', function (t, done) {

                return http.get({
                    hostname: 'example.com',
                    path: val,
                    headers: {
                        'Accept': 'text/plain',
                        'Content-Type': 'application/json'
                    }
                }, function (res) {

                    res.setEncoding('utf8');

                    var body = '';

                    res.on('data', function (data) {
                        body += data;
                    });

                    res.on('end', function () {
                        var result = JSON.parse(body);
                        assert(result.x = 'y');
                        done();
                    });
                });
            });
        });
    });
});