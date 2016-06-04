/**
 * Created by Olegzandr on 5/26/16.
 */

const chokidar = require('chokidar');

//////////////////////////


const opts = {


};


module.exports = {

	watcher: null,

	initWatcher: function (p) {

		// this.watcher = chokidar.watch('file, dir, glob, or array', {
		// 	ignored: /[\/\\]\./,
		// 	persistent: true
		// });

		this.watcher = chokidar.watch(p, opts);
	}

};

function getWatcher() {

	if (watcher) {
		return watcher;
	}
	else {



// One-liner for current directory, ignores .dotfiles
// 	chokidar.watch('.', {ignored: /[\/\\]\./}).on('all', (event, path) => {
// 		console.log(event, path);
// 	});

// Initialize watcher.


// Something to use when events are received.
		var log = console.log.bind(console);
// Add event listeners.
		watcher
			.on('add', path => log(`File ${path} has been added`))
			.on('change', path => log(`File ${path} has been changed`))
			.on('unlink', path => log(`File ${path} has been removed`));

// More possible events.
		watcher
			.on('addDir', path => log(`Directory ${path} has been added`))
			.on('unlinkDir', path => log(`Directory ${path} has been removed`))
			.on('error', error => log(`Watcher error: ${error}`))
			.on('ready', () => log('Initial scan complete. Ready for changes'))
			.on('raw', (event, path, details) => {
				log('Raw event info:', event, path, details);
			});

// 'add', 'addDir' and 'change' events also receive stat() results as second
// argument when available: http://nodejs.org/api/fs.html#fs_class_fs_stats
		watcher.on('change', (path, stats) => {
			if (stats) {
				console.log(`File ${path} changed size to ${stats.size}`);
			}
		});

		return watcher;

	}

}
