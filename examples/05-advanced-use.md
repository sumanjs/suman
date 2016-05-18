
Suman provides powerful features that are not available in any other Node.js test runner including AVA. The 3 files in the suman
folder in your project allow you to really boost the power of your testing process.

1. User (that's you!) defined hooks using suman.once.js, which will only run once when they are listed as 
"integrants" in any suman suite. The best use case for these hooks is to check that certain network
components are living before running a test. If the service is not available, suman report this and abort the tests
early, allowing you better information about what component might not be live.

2. Dependency injection is controlled by you, when you edit the suman.ioc.js file. In the suman.ioc.js file you see 3 examples,
showing you how to inject values into a test suite. There are several advantages to this. One, you save some verbosity in each
test suite. If several tests in your project need the same resource, this resource can be initialized and procured in
suman.ioc.js, instead of initializing repetively in multiple tests. This is especially useful for resources that need to be
initialized/loaded asynchronously. The simplest example is database values that you might use in multiple tests.

3. Order and constraints for the test runner, using suman.order.js. 
Unbridled, the test runner may run 1000+ tests in separate processes if you tell it to at the same time.
