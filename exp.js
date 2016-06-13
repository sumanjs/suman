/**
 * Created by Olegzandr on 5/14/16.
 */

process.on('uncaughtException', function(e){
	console.log(' => Uncaught Exception caught globally =>', e.stack || e);
});


require('foo-does-not-exist')