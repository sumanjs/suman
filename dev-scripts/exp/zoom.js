const v8flags = require('v8flags');

v8flags(function (err, results) {
  
  if (err) throw err;
  
  results.sort().forEach(function (r) {
    console.log(r);
  });
  
});
