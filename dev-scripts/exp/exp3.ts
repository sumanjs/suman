
//
// type T = (x: number) => boolean;
//
// let fn = function(a: string, b: boolean, c: T){ c()};
//
// fn('yes', true, (() => {
//
// }) as any);
//
// fn('yes', true, <any>(() => {
//
// }));
//
// debugger;

//
// class Person {
//   constructor(public name: string) {}
//   greet(greeting: string): string { return `${greeting}, ${this.name}`; }
// }
//
// interface Person {
//   hi: typeof Person.prototype.greet;
// }
//
//
// Person.prototype.hi = Person.prototype.greet;
//
// const p = new Person("Alice");
// console.log(p.greet("Hey"));
// console.log(p.hi("Hi"));


class Bar {

}

const makeBar = function () {
 return new Bar(...arguments);
};


