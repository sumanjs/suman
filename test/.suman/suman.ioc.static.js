'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function ($core, $deps) {
    return {
        dependencies: {
            'chuck': function () {
                return 'berry';
            },
            'mark': function (cb) {
                cb(null, 'rutherfurd');
            },
        }
    };
});
