/**
 * Created by denman on 12/15/15.
 */




var path = require('path');
process.chdir(path.resolve(__dirname + '/../')); // TODO ? why ?


process.on('uncaughtException', function (err) {
    console.error('=> Suman => Uncaught Exception => ' + err.stack);
});

/////////////////////////////////////////////////////////////

var debug = require('debug')('suman:server');
var http = require('http');
var _ = require('underscore');
var fs = require('fs');

//////////////////////////////////////////////////////////////



var pathToProvider = 'server/config/conf';

//config
var config = require('univ-config')(module, '*suman*', String(pathToProvider).toString());

var configPath;
if (path.isAbsolute(pathToProvider)) {  //consumer of this lib has been so kind as to provide an absolute path, the risk is now yours
    configPath = path.normalize(pathToProvider);
}
else {
    var pth = path.dirname(module.filename);
    var root = findRoot(pth);
    configPath = path.resolve(path.normalize(root + '/' + pathToProvider));
}

console.log('\n',' => Suman config path: ', configPath);

var sumanLogos = require('../../lib/ascii');
console.log(sumanLogos.suman_alligator);


function findRoot(pth) {

    var possibleNode_ModulesPath = path.resolve(path.normalize(String(pth) + '/package.json'));

    try {
        fs.lstatSync(possibleNode_ModulesPath).isFile();
        return pth;
    }
    catch (err) {
        var subPath = path.resolve(path.normalize(String(pth) + '/../'));
        if (String(subPath) === String(pth)) {
            return null;  //we are at the root of the filesystem most likely
        }
        else {
            return findRoot(subPath);
        }
    }

}


/////////////////////////////////////////////////////////////////////////


var app = require('../app');
app.set('port', process.env.PORT || '6969');
var httpServer = http.createServer(app);
var socketServer = require('./socket-server');

httpServer.listen(app.get('port'));
httpServer.on('error', onError);
httpServer.on('listening', onListening);


function onError(error) {
    console.error(error.stack);
}

var sock = true;

function onListening() {

    var addr = httpServer.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    console.log('\tServer listening on ' + bind, ', CWD =', process.cwd() + '\n\n');

    if (sock) {
        sock = false;
        socketServer(httpServer);
    }

}

process.on('SIGINT', function (code) {
    console.log('...SIGINT caught, code => ' + code, ', exiting ...');
    process.exit(code);
});


module.exports = httpServer;
