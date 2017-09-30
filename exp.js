

//
// let sym = Symbol('foo');
// let sym2 = Symbol('foo');
// let obj = {};
// obj[sym] = 5;
// console.log(obj[sym]);
// console.log(obj[sym2]);
//


console.log('the beginning');
const chai = require('chai');
const chaiAssert = chai.assert;

const assrt = function() {
  try {
    return chaiAssert.apply(chaiAssert, arguments);
  } catch (e) {
    return console.error(e);
  }
};

const v = {};
v.assert = new Proxy(assrt, {
  get: function(target, prop) {

    if (typeof prop === 'symbol') {
      return Reflect.get(...arguments);
    }


    return function() {
      try {
        return chaiAssert[prop].apply(chaiAssert, arguments);
      } catch (e) {
        console.error(`Looks like property '${prop}' does not exist on chai assert object.`)
        return console.error(e);
      }
    }
  }
});

console.log('v => ',v);  // in Node.js, this kind of call will cause the issue whereby ghost properties are sent
// to the get method of the Proxy.

JSON.stringify(v);

// but we can see that Proxy works here:
v.assert.equal(true,true,'whoops nope');

console.log('the end');
