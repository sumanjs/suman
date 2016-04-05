You can easily convert a single Mocha test or directory of Mocha tests to Suman tests with the following command:

<br>
<span style="background-color:#9ACD32">&nbsp;```$ suman --convert <src-dir/src-file> <dest-dir/dest-file>```</span>
<br>
<br>
<br>

### Making the switch, taking the plunge

The best steps to complete the switch from Mocha to Suman are as follows: 

1. Create a commit or tag before you do anything further; the commit message might be "last commit pre-suman takeover"

2. Rename your test directory to "test-old" or whatever your test directory is called if it's not "test"

3. <span style="background-color:#9ACD32">&nbsp;```$ suman --convert test-old test```</span>

Now you have Suman tests replacing all your Mocha tests in your original test directory!
You can compare the new Suman tests with the old Mocha tests in test-old for awhile, for reference.