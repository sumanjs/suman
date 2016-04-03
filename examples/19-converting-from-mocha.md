You can easily convert a single Mocha test or directory of Mocha tests to Suman tests with the following command:

<br>
<span style="background-color:#9ACD32">```$ suman --convert <src-dir/src-file> <dest-dir/dest-file>```</span>
<br>

The best steps to complete the switch from Mocha to Suman. 

1. Create a commit or tag before you do anything further; the commit message might be "last commit pre-suman"

2. Rename your test directory to "test-old" or whatever your test directory is called if it's not "test"

3. <span style="background-color:#9ACD32">```$ suman --convert test-old test```</span>

Now you have Suman tests in your test directory!