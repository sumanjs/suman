

const proto = Object.create(Function.prototype);

proto.addProp = function(prop, val){
  this[prop] = val;
  return this;
};

const fn = function(){

};

Object.setPrototypeOf(fn, proto);


fn.addProp('foo','bar');


console.log(fn.foo); // => 'bar'
