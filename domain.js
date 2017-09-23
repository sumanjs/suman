const chai = require('chai');
const assert = chai.assert;

let assrt = function () {
  return assert.apply(null, arguments);
};

const p = new Proxy(assrt, {

  get: function (target, prop) {
    return function () {
      try {
        console.log('prop => ', prop);
        return assert[prop].apply(null, arguments);
      }
      catch (err) {
        console.error(err.stack || err);
      }
    }
  }

});


p.equal(true, false, 'dinosaur');

