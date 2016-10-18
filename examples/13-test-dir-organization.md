The optimal way to organize your test directory for Suman usage is as follows:


--test
---/fixtures
---/test-src


src contains your test files, and if you want to transpile them, the test dir will look like:


--test
---/fixtures
---/src
---/target


otherwise, if you have something like this:

--test
---/fixtures
---/test-src
---/test-target