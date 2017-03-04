'use strict';

const async = require('async');

///////////////////////////////////////////////////////////////////

module.exports = function (suite, cb) {

  async.eachSeries(suite.getInjections(), function (inj, cb) {

    var callable = true;

    const to = setTimeout(function(){
      first(new Error(' => Injection timeout.'));
    }, 5000);

    const first = function(err){
      if(callable){
        callable = false;
        clearTimeout(to);
        process.nextTick(function(){
          cb(err)
        });
      }
      else if(err){
          console.error(err.stack || err);
      }
    };


    if (inj.cb) {

      inj.fn.call(suite, function (err, results) {

          if (err) {
            first(err);
          }
          else {
            Object.keys(results).forEach(function (k) {
              suite.injectedValues[k] = results[k];
            });

            first();
          }
      });

    }

    else {

      const ret = inj.fn.call(suite);

      const keys = Object.keys(ret);
      const vals = keys.map(function (k) {
        return ret[k];
      });

      Promise.all(vals).then(function (vals) {

        keys.forEach(function (k, index) {
          suite.injectedValues[k] = vals[index];
        });

        first();

      }, first);

    }

  }, cb);

};
