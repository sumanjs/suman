function log (d) {

  if (!String(d).match(/npm info/ig) && !String(d).match(/npm http/ig)) {
    console.log(d);
    // process.stderr.write(String(d));
  }
}

const fs = require('fs');

var line = 'npm info';

fs.readFile(__dirname + '/.gitignore', function(err,data){
  console.log(err);
  console.log(data);

  if(String(data).indexOf('item') < 0){
    fs.appendFile(__dirname + '/.gitignore','item', function(err, res){
      console.log(err);
      console.log(res);
    });
  }

});