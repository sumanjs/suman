'use strict';

var suman = require('../../lib');
var Test = suman.init(module, {});

Test.describe('root suite description', {}, function () {
    // we define the root suite

    //note: we are in the context of the "root suite"

    var self = this; // (avoid the self pattern in Suman tests, here for explanation only :)

    this.before(regeneratorRuntime.mark(function _callee() {
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
    }));
});