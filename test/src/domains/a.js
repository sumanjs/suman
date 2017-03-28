

const domain = require('domain');
const d = domain.create();


d.on('error', function(err){
  console.error(' => Domain caught => ',err.stack);
});


d.run(function(){

  process.nextTick(function(){
    throw new Error('blage');
  });

});
