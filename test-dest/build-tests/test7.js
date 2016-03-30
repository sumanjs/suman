'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by denman on 1/2/2016.
 */

var Test = require('../../lib').init(module, {
    export: false, //module.exports.wait = false;
    integrants: ['smartconnect', 'dolce-vida']
});

Test.describe('BBB', { parallel: true }, function (fs) {

    this.before(function (ctn) {
        ctn();
        throw new Error('barf');
    });

    this.beforeEach(function (t, ctn) {

        ctn('poop');
    });

    this.context('1', { efa: true }, function () {

        this.before(function (done) {

            setTimeout(function () {
                done();
            }, 10);
        });

        this.test('[test] yo 1', { parallel: true }, function (t, fail, done, pass) {

            fs.createReadStream('/dev/null').pipe(fs.createWriteStream('/dev/null')).on('error', fail).on('finish', pass);
        });

        this.test('[test] yo 2', { parallel: false }, function (t) {

            return new _promise2.default(function (resolve, reject) {

                resolve();
            });
        });

        //this.it('[test] yo 2', {parallel: false}, new Promise(function (resolve, reject) {
        //
        //    Promise.delay(1000).then(function () {
        //        resolve();
        //    });
        //
        //}).then(function(){
        //
        //
        //
        //}));

        function p(val) {
            return new _promise2.default(function (resolve) {
                resolve('doooog' + val);
            });
        }

        this.it('[test] gen', { parallel: false }, _regenerator2.default.mark(function _callee() {
            var t, val;
            return _regenerator2.default.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            _context.next = 2;
                            return 3;

                        case 2:
                            t = _context.sent;
                            _context.next = 5;
                            return p();

                        case 5:
                            val = _context.sent;
                            _context.next = 8;
                            return p(val);

                        case 8:
                            val = _context.sent;

                        case 9:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        }));

        this.it('yo', { parallel: false }, function (t, done) {

            setTimeout(function () {
                done();
            }, 100);
        });

        this.it('chubs', { parallel: false }, function (t, done) {

            setTimeout(function () {
                done();
            }, 100);
        });
    });

    this.before(function () {});
});

/*


 Test.describe('BBB2', function () {


 this.before(() => {


 }).beforeEach(() => {


 });


 this.describe('1', {efa: true}, function () {

 this.before((done) => {

 setTimeout(function () {
 done();
 }, 10);
 });

 this.it('[test] yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 600);

 });

 this.it('yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });

 this.it({parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });


 });


 this.before(() => {

 });


 });


 Test.describe('BBB2', function () {


 this.before(() => {


 }).beforeEach(() => {


 });


 this.describe('1', {efa: true}, function () {

 this.before((done) => {

 setTimeout(function () {
 done();
 }, 10);
 });

 this.it('[test] yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });

 this.it('yo', {parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });

 this.it({parallel: false}, (t, done) => {

 setTimeout(function () {
 done();
 }, 500);

 });


 });


 this.before(() => {

 });


 });
 */