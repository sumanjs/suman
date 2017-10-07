module.exports = function ($core, $deps, $root) {
    var events = $core.events, child_process = $core.child_process, util = $core.util;
    return {
        dependencies: {
            'dog': function () {
                return 'labrador';
            },
            'cat': ['dog', function () {
                    return 'feline';
                }],
            'mouse': ['dog', function () {
                    return 'feline';
                }],
            'one': ['four', function (v) {
                    return 'this is one';
                }],
            'two': [function (v) {
                    return 'this is two';
                }],
            'three': ['one', 'two', 'four', function (v) {
                    return 'this is three';
                }],
            'four': ['two', function (v) {
                    return 'this is four';
                }],
            'charlie': function () {
                return 'charlie';
            },
            'smartconnect': function () {
                return Promise.resolve(JSON.stringify({
                    formica: 'not metal'
                }));
            },
            'dolce-vida': function (v, cb) {
                setTimeout(function () {
                    cb(null, "new Error('uuuu rub')");
                }, 10);
            },
            'mulch': function (v, cb) {
                setTimeout(function () {
                    cb(null, "new Error('mulch')");
                }, 10);
            }
        }
    };
};
