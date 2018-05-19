class A {
  public bar: string;
  constructor() {
  
  }
}

class B extends A {
  public bar: string;
  constructor() {
    super();
    this.bar = 'bar';
  }
}

const b = new B();
debugger;

