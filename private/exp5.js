/**
 * Created by Olegzandr on 5/16/16.
 */


const cp = require('child_process');


const n = cp.spawn('sh',['/Users/amills/WebstormProjects/oresoftware/suman/lib/make-tail/tail-2.sh'],{
	env: {
		FILE_TO_TAIL:'/Users/amills/WebstormProjects/oresoftware/suman/test/suman/logs/server.log'
	}
});



