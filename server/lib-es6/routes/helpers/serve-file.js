/**
 * Created by denman on 12/14/2015.
 */


var url = require('url');
var fs = require('fs');
var path = require('path');


module.exports = function(req,res){

    var helpers = require('index');

    var fsPath = req.sumanData.fsPath;

    console.log('fsPath:', fsPath);

    fs.stat(fsPath, function (err, stat) {

        if (err) {
            console.log('error occurred...' + err);
            return helpers.finishResponse(req, res);
        }

        console.log('no error...');

        try {
            if (stat.isFile()) {
                res.writeHead(200);
                var stream = fs.createReadStream(fsPath).pipe(res); //calls res.end()
            }
            else {
                res.writeHead(500);
            }
        }
        catch(err){
            helpers.finishResponse(req, res);
        }


    });

};