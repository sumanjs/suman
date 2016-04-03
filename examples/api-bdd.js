

// ## Distilled Suman BDD interface API


/** This is suman. */
const suman = {};



suman.init = function init(module, options) {
//This is a description of the init function.

};



//We initialized suman in a test suite file
//Test is a singleton on which describe is a factory function
const Test = suman.init(module, {});



Test.describe = function(description, options, callback){

    
     //Test.describe fits the factory pattern and creates test suites
     //bound context of callback is a new TestSuite instance
     //whichever params are included in callback signature will be injected via your suman.ioc.js file
     //additionally, all core modules are available as well as Suman internal values "delay" and "suite"

    
    
    
    
};



function TestSuite() {
    // this constructor is internal to Suman and you don't need to call it
}




TestSuite.prototype.describe = function describe(description, options, callback) {

    //context of callback is new TestSuite instance
    
    
};


// This is a description of the before function outside
TestSuite.prototype.before = function before() {
    
// This is a description of the before function inside
    
    

};


/** This is a description of the after function. */
TestSuite.prototype.after = function after() {


};

/** This is a description of the beforeEach function. */
TestSuite.prototype.beforeEach = function beforeEach() {


};


/** This is a description of the afterEach function. */
TestSuite.prototype.afterEach = function afterEach() {


};


/** This is a description of the it function. */
TestSuite.prototype.it = function it() {


};





