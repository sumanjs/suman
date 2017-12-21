var Person = (function () {
    function Person(name) {
        this.name = name;
    }
    Person.prototype.greet = function (greeting) { return greeting + ", " + this.name; };
    return Person;
}());
Person.prototype.hi = Person.prototype.greet;
var p = new Person("Alice");
console.log(p.greet("Hey"));
console.log(p.hi("Hi"));
