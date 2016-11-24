

console.log(' all good!');
console.error(' is error!');

At one point I thought you could tell Node.js child process to chunk the data by newline character.

  I have this:



const sh = spawn('sh', [ b ], {
  cwd: cwd,
});

sh.stdout.pipe(fs.createWriteStream('/dev/null'));

var stderr = '';
var line = '';

sh.stderr.setEncoding('utf8');

sh.stderr.on('data', function (d) {

  //trying to split by newlines, but this is hairy logic
  const lines = String(d).split('\n');

  line += lines.shift();

  if(lines.length > 0){

    if (!String(d).match(/npm/ig) && !String(d).match(/npm/ig)) {
      stderr += d;
      process.stderr.write.apply(process.stderr, arguments);
    }

  }

});

and the data come back in this handler is not whole lines

sh.stderr.on('data', function (d) {
  // d is chunks of data but not whole lines
});

isn't there a way to tell stderr to wait for newline chars before firing the 'data' event?


