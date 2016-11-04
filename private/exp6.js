

const stream = require('stream');

var jsonData = [];

var strm = new stream.Writable({
   write: function(chunk, encoding, next) {

      jsonData.push(chunk.toString());
      next();
   }

});


strm.on('foo',function(msg){
   console.log(msg); //doesn't get called
});

strm.emit('foo','bar');  //this doesn't seem to do anything