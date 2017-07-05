const suman = require('suman');
const Test = suman.init(module);

//project
const _suman = global.__suman = (global.__suman || {});
const resultBroadcaster = _suman.resultBroadcaster = (_suman.resultBroadcaster || new EE());

Test.create(function (it) {

  it('bbbbb');

  it('kppppp', ['skipped:true']);

  it('success', t => {

  });

});
