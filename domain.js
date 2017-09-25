const Domain = require('domain');
const d1 = Domain.create();
const util = require('util');

d1.id = 1;

d1.once('error', function () {

});

d1.run(function () {

  const d2 = Domain.create();

});
