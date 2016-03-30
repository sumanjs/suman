'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lib = require('../../lib');

var suman = _interopRequireWildcard(_lib);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Test = suman.init(module, {}); /**
                                    * Created by denman on 3/26/2016.
                                    */

Test.describe('Test uno', function () {
    var _this = this;

    this.it('is a test', function () {
        var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(t, done, fail, pass) {
            var foo, bar, baz;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _context.next = 2;
                            return 3;

                        case 2:
                            foo = _context.sent;
                            _context.next = 5;
                            return new _promise2.default(function (resolve) {
                                resolve('7');
                            });

                        case 5:
                            bar = _context.sent;
                            baz = bar * foo;

                            console.log(baz);

                        case 8:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, _this);
        }));
        return function (_x, _x2, _x3, _x4) {
            return ref.apply(this, arguments);
        };
    }());
});