/**
 * Created by Olegzandr on 5/24/16.
 */

var bool = true;

setInterval(function(){
	bool = !bool;
	if(bool){
		console.log('watching');
	}
	else{
		console.log('making')
	}

},1000);


