/**
 * Created by amills001c on 12/11/15.
 */


var url = require('url');
var fs = require('fs');
var appRootPath = require('app-root-path');
var path = require('path');

function handleRequest(req, res) {

    var requestUrl = url.parse(req.url);

    console.log('requestUrl:', requestUrl);


    var fsPath;
    if (requestUrl.pathname === '/') {
        fsPath = path.resolve(appRootPath + '/view/index.html');
        console.log('will attempt to serve this file:',fsPath);
    }
    else {
        fsPath = path.resolve(appRootPath + '/view/' + requestUrl.pathname);
    }


    console.log('fsPath:', fsPath);


    fs.stat(fsPath, function (err, stat) {

        if (err) {
            console.log('error occurred...' + err);
            return end(req, res);
        }

        console.log('no error...');

        try {
            if (stat.isFile()) {
                res.writeHead(200);
                var stream = fs.createReadStream(fsPath).pipe(res);

                //var stream = fs.createReadStream(fsPath);
                //
                //var resp = '';
                //
                //stream.on('data',function(data){
                //    resp+=data;
                //});
                //
                //stream.on('end',function(){
                //    res.write(resp);
                //    end(req,res);
                //});

            }
            else {
                res.writeHead(500);
            }
        }
        catch(err){
            end(req, res);
        }


    });


}


function end(req, res) {
    res.end(); // inside finally so errors don't make browsers hang
}


module.exports = handleRequest;