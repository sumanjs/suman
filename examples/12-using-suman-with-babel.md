First, to dissuade you from transpiling tests before you run them.

It's probably a bad idea to use Babel to transpile tests. Our view is that you should only use features that are currently
available via Node itself. 


1. Babel slows down development of tests, because running an individual test through Babel takes time. You thought starting up the JVM was slow?
2. If you need to transpile a test file, you obviously can't just run it with the node executable, which is inconvenient at best.
3. Async/await feature can be achieved directly via generators/yield, so we recommend just using plain-old generator functions until ES7 is finalized and part of Node itself.
4. If you use a feature that's only available in Babel in your test, you might find yourself needing to use that construct in your regular
code base, and if you aren't using Babel with your actual codebase, that might present a problem.
5. Maintaining Suman to be compatible with future versions of node, is difficult and we simply cannot guarantee smooth sailing, in the same
way we can with current versions of Node.


Here is a description of how async/await can be achieved via generators:






Now, if you still really want to run your Suman tests through Babel, even if it's just for experimentation, you can do it.



