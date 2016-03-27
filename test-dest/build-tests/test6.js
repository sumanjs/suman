function _asyncToGenerator(fn) {
    return function () {
        var gen = fn.apply(this, arguments);
        return new Promise(function (resolve, reject) {
            function step(key, arg) {
                try {
                    var info = gen[key](arg);
                    var value = info.value;
                } catch (error) {
                    reject(error);
                    return;
                }
                if (info.done) {
                    resolve(value);
                } else {
                    return Promise.resolve(value).then(function (value) {
                        return step("next", value);
                    }, function (err) {
                        return step("throw", err);
                    });
                }
            }

            return step("next");
        });
    };
}

/**
 * Created by denman on 3/26/2016.
 */

const suman = require('../../lib');
const Test = suman.init(module);

Test.describe('Test uno', function () {

    debugger;

    this.it('is a test', function () {
        var ref = _asyncToGenerator(function* (t, done, fail, pass) {

            const foo = yield 3;
            const bar = yield new Promise(function (resolve) {
                resolve('7');
            });
            const baz = bar * foo;
            console.log(baz);
        });

        return function (_x, _x2, _x3, _x4) {
            return ref.apply(this, arguments);
        };
    }());
});