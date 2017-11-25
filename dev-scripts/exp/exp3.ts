class A {
  
  foo (): this {
    return this;
  }
  
}

class B extends A {
  
  bar(): B {
    return this;
  }
  
}


new B().foo().bar();
