
import suman from 'suman';
import {XXX} from "./namespaces";
const {Test} = suman.init(module);


Test.create('age', b => {

  const {after, it, describe} = b.getHooks();

  it('foo', t => {

  });

  describe('age', b => {


  });


});

const v : XXX.foo= 'age'


Test.define('foo').source('boo').run(b => {

  const c =  b.getSourced();
  const d =  b.getSourcedValue('boo');
  console.log(c);
  console.log(d);
});
