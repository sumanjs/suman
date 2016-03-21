//core
var supertest = require('supertest');
var assert = require('assert');


describe('@Test_GET_routes*', function() {

  var self = null;

  before(function() {

    self = this;
    var config = self.config = require('univ-config')(module, this.test.parent.title, 'config/test-config');
    var constants = config.get('sc_constants');
    var serverURL = config.get('test_env').smartconnect_server_config.url;
    var serverPort = config.get('test_env').smartconnect_server_config.port;
    self.serverName = serverURL + ':' + serverPort;
  });


  describe('@Test_all_GET_routes', function() {

    it('Should return 200 when /log_stdout is called.', function(done) {
      supertest(self.serverName)
        .get('/log_stdout')
        .expect(200)
        .end(function(err) {
          assert(err == null);
          done();
        });
    });

    it('Should return 200 when /log_stderr is called.', function(done) {
      supertest(self.serverName)
        .get('/log_stderr')
        .expect(200)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should return 200 when /heartbeat is called.', function(done) {
      supertest(self.serverName)
        .get('/heartbeat')
        .expect(200)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should return 200 when /redisData is called.', function(done) {
      supertest(self.serverName)
        .get('/redisData')
        .expect(200)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should return 200 when /info is called.', function(done) {
      supertest(self.serverName)
        .get('/info')
        .expect(200)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });

    it('Should return 200 when /event is called.', function(done) {
      supertest(self.serverName)
        .get('/event')
        .expect(200)
        .end(function(err, res) {
          assert(err == null);
          done();
        });
    });
  });
});
