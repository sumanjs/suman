class A {
    constructor() {
    }
}
class B extends A {
    constructor() {
        super();
        this.bar = 'bar';
    }
}
const b = new B();
debugger;
