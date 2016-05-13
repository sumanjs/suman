'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { return step("next", value); }, function (err) { return step("throw", err); }); } } return step("next"); }); }; }

var suman = require('../../lib/index');
var Test = suman.init(module, {});

Test.describe('root suite description', {}, function () {
    // we define the root suite

    //note: we are in the context of the "root suite"

    var self = this; // (avoid the self pattern in Suman tests, here for explanation only :)

    this.before(_asyncToGenerator(regeneratorRuntime.mark(function _callee() {
        var bnans;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return new Promise(function (resolve) {
                            resolve('bananas');
                        });

                    case 2:
                        bnans = _context.sent;

                        console.log('bananas:', bnans);
                        console.log('1', this === self); //true

                    case 5:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    })));
});