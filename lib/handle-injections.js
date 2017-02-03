const async = require('async');

module.exports = function (suite, cb) {

  async.eachSeries(suite.getInjections(), function (inj, cb) {

    if (inj.cb) {

      inj.fn.call(suite, function (err, results) {

        process.nextTick(function () {
          if (err) {
            cb(err);
          }
          else {
            Object.keys(results).forEach(function (k) {
              suite.injectedValues[k] = results[k];
            });

            cb();
          }
        });
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

        cb();

      }, cb);

    }

  }, cb);

};
