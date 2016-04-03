There are several anti-patterns when using Suman


1. self/that. I am personally a fan of self/that usage. However, when using Suman, it is indeed an anti-pattern. If you notice that you
have used self or that instead of this, then you should write your code to avoid the self pattern.

2. Putting code outside of Test.describe. As much code as possible should be inside the Test.describe callback.
There are several reasons for this. It makes it a bit easier to see the title of your suite. It also minimizes the 
amount of code loaded before a test suite is actually run.

3. Arrow functions for describe blocks. Arrow functions are useful for Suman, and they can be used everywhere except 
for describe blocks. This has to do with arrow functions binding the context for the callback to the wrong value.

