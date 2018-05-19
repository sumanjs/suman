
let mySharedFn = function () {

};

export class Foo {
  public bar = mySharedFn
  public aliasBar = mySharedFn
}
