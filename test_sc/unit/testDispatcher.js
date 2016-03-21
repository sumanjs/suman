/**
 * @author: jpalal001c on 03/08/2016
 * To run:
 * $ mocha test/unit/testDispatcher.js
 */

var assert = require('assert');
//require dispatcher:
var dispatcher = require('../../lib/dispatcher');

describe('dispatcher', function(){
    before(function() {
        var http = require('http');
        this.mockServer1 = http.createServer(function(request, response) {
            response.end('Mock Server 1 hit');
        }).listen(5050);

        this.mockServer2 = http.createServer(function(request, response) {
            response.end('Mock Server 2 hit');
        }).listen(5051);

    });
    after(function(done){
            this.mockServer1.close();
            this.mockServer2.close();
            done();
    });
    describe('#sendRequests', function(){

            it('sendRequests should get a statusCode from request result', function(done){

                var csOpts = require('./fixtures/csReqOptions.json');
                csOpts.url = 'http://localhost:5050';
                var meldOpts = require('./fixtures/meldReqOptions.json');
                meldOpts.url = 'http://localhost:5051';
                var services = ['Context Store','MELD'];

                dispatcher.sendRequests([csOpts, meldOpts], services, function(err, results) {
                    if(err) {
                        assert.strictEqual(err, err, 'An error has occured in passing options');
                    } else {
                        assert.notEqual(results[0].statusCode, null);
                    }
                    done();
                });

    });



    });
});
