

const fs = require('fs');


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