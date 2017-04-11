'use strict';
module.exports = function freezeExistingProps(obj) {
    try {
        Object.keys(obj).forEach(function (key) {
            Object.defineProperty(obj, key, {
                writable: false
            });
        });
    }
    catch (err) { }
    return obj;
};
