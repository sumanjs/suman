/**
 * Created by amills001c on 4/14/16.
 */


const timer = setTimeout(function(){

    console.log('before');
},300);



setTimeout(function(){
 clearTimeout(timer);
    console.log('cleared');
},2000);