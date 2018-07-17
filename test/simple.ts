
import suman from 'suman';
const {Test} = suman.init(module);


Test.create('age', b => {

  const {after, it, describe} = b.getHooks();

  it.only('foo', t => {

  });

  describe('age', b => {

    b.getInjectedValues()

  });


});
