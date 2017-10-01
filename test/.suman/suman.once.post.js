module.exports = function ($pre) {
    return {
        dependencies: {
            'charlie': [function () {
                    return 'charlie';
                }],
            'smartconnect': ['charlie', function () {
                    return Promise.resolve({
                        formica: 'not metal'
                    });
                }],
            'dolce-vida': function (cb) {
                setTimeout(function () {
                    cb(null, new Error('rub'));
                }, 10);
            },
            'judas': function () {
                return new Promise(function (resolve) {
                    setTimeout(resolve, 100);
                });
            },
            'ugly': function () {
                return new Promise(function (resolve) {
                    setTimeout(resolve, 100);
                });
            }
        }
    };
};
