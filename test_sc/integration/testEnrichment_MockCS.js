/*

 Created by pbarve001c on 10/23/15
 This mocha test compares enrichment data from csv to the actual enrichment received by context store through Baymax.

 Note -
 1. The test uses mock servers, can only be executed using NODE_ENV=test_local
 2. Updated itg-ivr.csv should reside at /test/test_data/ivr_itg.csv

 */

var Converter = require('csvtojson').Converter;
var request = require('request');
var _ = require('underscore');
var assert = require('assert');
var http = require('http');
var fs = require("fs");

JSON.minify = JSON.minify || require('node-json-minify');

var jsonData = require('../test_data/other_payloads/ivr_enrich.json');
var actualEnrichment = null;
var csvFileName = __dirname + '/../test_data/ivr_itg.csv';
var $url;

// Subset of 'Primary Key' from  ivr_itg.csv
var eventTypes = [
  'On Demand General',
  'Guide To Be Announced',
  'Cable Card Issue',
  'Phone Connection',
  'Loyalty Department',
  'Password Email',
  'Pay',
  'Outagecheck',
  'Internet Wireless',
  'Internet General'
];

// Mock Context Store server
var mockCS = function(req, res) {

  var responseBody = '';

  req.on('data', function(data) {
    responseBody += data;
  });

  req.on('end', function() {
    var jsonBody = JSON.parse(responseBody);
    actualEnrichment = jsonBody.incident.data;
  });

  res.writeHead(201, {"Content-Type": "application/json"});
  res.write("Mock CS Server");
  res.end();

};

// Mock MELD server
var mockMELD = function(req,res) {
  res.writeHead(200, {"Content-Type": "application/json"});
  res.write("Mock MELD server");
  res.end();
};

/* Remove empty LaunchTool and LaunchItg params
  item : enrichment data */
function manipulateData(item) {
  if (item.hasOwnProperty('LaunchTool') || item.hasOwnProperty('LaunchItg')) {

    var filterValues = function(values) {
      return values.Label !== "" && values.URI !== ""
    };

    item.LaunchTool = item.LaunchTool.filter(filterValues);
    item.LaunchItg = item.LaunchItg.filter(filterValues);
  }

  return item;
}

/*  jsonData : request to send
    expectedEnrichment : enrichment data from csv */
var sendRequest = function(jsonData, expectedEnrichment, callback) {

  request({
      url: $url,
      json: true,
      body: jsonData,
      method: 'POST'
    },
    function(err, response) {

      assert(err == null);
      assert.equal(201, response.statusCode, "Incorrect Status Code.");
      manipulateData(expectedEnrichment); 
      if (!_.isEqual(expectedEnrichment, actualEnrichment)) {
        assert.fail(actualEnrichment, expectedEnrichment, "Incorrect Enrichment.");
      }
      callback(null);
    });
};


describe('@Test_Enrichment_MockCS*', function() {

  before(function() {

    var config = this.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    this.constants = this.config.get('sc_constants');
    this.serverURL = this.config.get('test_env').smartconnect_server_config.url;
    this.serverPort = this.config.get('test_env').smartconnect_server_config.port;
    $url = this.serverURL.concat(':').concat(this.serverPort).concat('/event');

    // start mock servers
    this.mockCSServer = http.createServer(mockCS).listen(5000);
    console.log('Mock CS started on port 5000.');
    this.mockMELDServer = http.createServer(mockMELD).listen(5002);
    console.log('Mock MELD started on port 5002.');

  });

  after(function() {

    // stop mock servers
    this.mockCSServer.close();
    this.mockMELDServer.close();
    console.log("Mock servers stopped!");
  
  });

  eventTypes.forEach(function(event) {

    it('[test] ' + event, function(done) {

      var csvConverter = new Converter({
        checkType: false // dont check field type
      });

      fs.createReadStream(csvFileName).pipe(csvConverter);

      jsonData.payload.events[0].type = event;

      csvConverter.on('record_parsed', function(enrichedObj) {

        if (enrichedObj.hasOwnProperty('Primary Key')) {
          if (jsonData.payload.events[0].type.toUpperCase() === enrichedObj['Primary Key'].toUpperCase()) {
            delete enrichedObj['Primary Key'];
            sendRequest(jsonData, enrichedObj, function() {
              done();
            });
          }
        }
      });
      
    });
  });
});
