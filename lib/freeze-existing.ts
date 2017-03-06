'use strict';

export = function freezeExistingProps(obj: any) {

    Object.keys(obj).forEach(function (key) {

        Object.defineProperty(obj, key, {
            writable: false
        });

    });

    return obj;

};
