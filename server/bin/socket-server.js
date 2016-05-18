//core
const fs = require('fs');

//npm
const socketio = require('socket.io');
const chokidar = require('chokidar');

//project
const constants = require('../../config/suman-constants');
const runTranspile = require('../../lib/transpile/run-transpile');

//////////////////////////

const opts = {
	// ignored: ['*.txt','*.log'],
	ignored: /(\.txt|\.log)$/
};

var watcher;

module.exports = function (server) {
	
	const io = socketio(server);

//io.on('connection', function(socket){
//    console.log('a user connected');
//});
	
	io.sockets.on('connection', function (socket) {
		
		console.log('\nClient connected.\n');
		
		socket.emit('message', 'listening');
		
		socket.emit('charlie1', 'a');
		
		// Disconnect listener
		socket.on('disconnect', function () {
			console.log('\nClient disconnected.\n');
		});
		
		socket.on('watch', function (msg) {
			
			msg = JSON.parse(msg);
			
			console.log('watch has been received by server', msg);
			console.log('paths received by server', msg.paths);
			
			if (watcher) {
				console.log('Watched paths before:', watcher.getWatched());
				watcher.add(msg.paths);
			}
			else {
				console.log('Watcher initialized.');
				watcher = chokidar.watch(msg.paths, opts);
				
				var log = console.log.bind(console);

// Add event listeners.
				
				watcher.on('add', p => {
					log(`File ${p} has been added`);
				});
				
				watcher.on('change', p => {
					log(`File ${p} has been changed`);
					runTranspile([p], {}, function (err, results) {
						if (err) {
							console.log('transpile error:', err);
						}
						else {
							console.log('transpile results:', results);
						}
					});

				});
				
				watcher.on('unlink', p => {
					log(`File ${p}has been removed`)
				});

// More possible events.
				watcher
					.on('addDir', p => log(`Directory ${p}has been added`))
					.on('unlinkDir', p => log(`Directory ${p}has been removed`))
					.on('error', error => log(`Watcher error: ${error}`))
					.on('ready', () => {
						log('Initial scan complete. Ready for changes');
						console.log('Watched paths:', watcher.getWatched());
					})
					.on('raw', (event, path, details) => {
						log('Raw event info:', event, path, details);
					});
			}
			
		});
		
		socket.on('TEST_DATA', function (data) {
			
			try {
				var json = JSON.stringify(data.test);
				
				if (data.outputPath) {
					
					//TODO: this functionality needs to mirror writing to disk in suman test runner etc
					
					console.log('TEST_DATA received - data.outputPath:', data.outputPath);
					
					process.nextTick(function () {
						socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
					});
					
					// fs.appendFile(data.outputPath, json += ',', function (err) {
					//     if (err) {
					//         console.error(err.stack);
					//         socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
					//     }
					//     else {
					//         //req.sumanData.success = {msg: 'appended data to ' + data.outputPath};
					//         socket.emit('TEST_DATA_RECEIVED', {msg: 'appended data to ' + data.outputPath});
					//     }
					// });
				}
				else {
					console.error(new Error('no output p for test data: ' + JSON.stringify(data)).stack);
				}
			}
			catch (err) {
				console.error(err.stack);
				socket.emit('TEST_DATA_RECEIVED', {error: err.stack});
			}
			
		});
		
	});
	
};