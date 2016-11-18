'use striiict';

//core
const util = require('util');

module.exports = function (run, opts, cb, fns, completeFns) {

  const makeRunCB = function (obj) {

    return function () {
      var fn;
      if (completeFns.length < 1) {
        fn = cb;
      }
      else {
        fn = run.bind(null, obj, cb);
      }
      const s2 = completeFns.shift();
      _interactiveDebug('s2 => ', String(s2));
      if (s2) {
        fns.unshift(s2);
      }
      fn();
    }

  };

  return fns.reduce(function (prev, curr, index) {

    _interactiveDebug('prev', util.inspect(prev));
    return prev.then(function (obj) {

      const runCB = makeRunCB(obj);

      if (index > 0) {

        const s1 = fns.shift();
        _interactiveDebug('s1 => ', String(s1));
        if (!s1) {
          throw new Error(' => Suman interactive implementation error.');
        }
        completeFns.unshift(s1);
      }

      return curr(runCB)(obj);
    });

  }, Promise.resolve(opts));

};