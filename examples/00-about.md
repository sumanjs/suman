Suman is a test <i>framework</i>, not a library. It gives you strong guidance on how to organization your tests, including naming conventions, test directory organization,
and preventing the use of global variables across tests. However Suman is unopinionated and agnostic when it comes to:

1. assertions
2. spies
3. reporters
4. mocking libraries

Suman provides an extremely powerful and versatile framework designed for maximum code reuse, test isolation,
parallelism with multiple Node.js processes and the best possible developer experience. Suman is designed to make 
tests "nodeable" by allowing any given test to be run with node itself, which frankly is amazing, 
as well as being highly debuggable with excellent error reporting and useful logging files. 

Suman also has built-in code coverage tooling (using Istanbul), as well as watchers that can run your test suite every-time you 
make a change to the codebase, or watchers which run a test file everytime you make a change to the test file.