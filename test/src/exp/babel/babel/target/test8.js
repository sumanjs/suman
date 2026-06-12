'use strict';

var _suman = require('suman');

var suman = _interopRequireWildcard(_suman);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var Test = suman.init(module);

////mcgee2

/**
 * Created by denman on 2/9/16.
 */

Test.describe('B3', {}, function (socketio, request, delay, assert, choodles, fs) {

    var paper = [];

    setTimeout(function () {
        paper.push('1');
        paper.push('2');
        paper.push('3');
        delay();
    }, 1000);

    this.it('oodles', function () {
        assert(paper[0] === '1');
    });

    this.it('oodles', function () {
        assert(paper[2] === '3');
    });

    this.describe('booram', function () {

        //


    });
});
