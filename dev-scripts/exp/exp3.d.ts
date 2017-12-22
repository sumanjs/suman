declare class Person {
    name: string;
    constructor(name: string);
    greet(greeting: string): string;
}
interface Person {
    hi: typeof Person.prototype.greet;
}
declare const p: Person;
