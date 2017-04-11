'use strict';

////////////////////////////////////

export = function freezeExistingProps(obj: any) {

  try {
    Object.keys(obj).forEach(function (key) {
      Object.defineProperty(obj, key, {
        writable: false
      });
    });
  }

  catch (err) {}

  return obj;

};
