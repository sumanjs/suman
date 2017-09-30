
//
// const v = {};
//
// var mirrorCache = {};
// const z  = new Proxy(v, {
//   set: function (target, property, value, receiver) {
//     if (mirrorCache[property]) {
//       throw new Error("property '" + property + "' has already been set.");
//     }
//     mirrorCache[property] = true;
//     Object.defineProperty(target, property, {
//       writable: true,
//       value: (value && typeof value === 'object') ? mcProxy(value) : value
//     });
//     return true;
//   }
// });
//
// z.foo = 3;
// console.log(z.foo); // 3
//
// const x = Object.assign({},v);
// console.log(x.foo);  // undefined  (expect to be 3)


console.log({bear: 'chair', moose: {goose: 3}});
