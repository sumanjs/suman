function log (d) {

  if (!String(d).match(/npm info/ig) && !String(d).match(/npm http/ig)) {
    console.log(d);
    // process.stderr.write(String(d));
  }
}

const foo = 'abc\ndef\nae\nz';
const lines = String(foo).split('\n');

var line = 'npm info';

line += lines.shift();

log('line 1 => ' + line);

for (var i = 0; i < lines.length - 1; i++) {
  log(lines[ i ]);
}

line = lines[ i ];

log('line 2 => ' + line);