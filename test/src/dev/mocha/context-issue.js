var assert = require('assert');

describe('Parent', function () {

  beforeEach(function () {
    this.value = 42
  });

  it('must pass 1', function () {
    assert.equal(this.value, 42)
  });

  it('must pass 2', function () {
    assert.equal(this.value, 42)
  });

  describe('Child1', function () {

    beforeEach(function () {
      assert.equal(this.value, 42);
      this.value = 13
    });

    it('must pass 3', function () {
      assert.equal(this.value, 13)
    });

    it('must pass 4', function () {
      assert.equal(this.value, 13)  /// this assertion throws
    });

  });

  describe('Child2', function () {

    beforeEach(function () {
      assert.equal(this.value, 42);
      this.value = 13
    });

    it('must pass 3', function () {
      assert.equal(this.value, 13)
    });

    it('must pass 4', function () {
      assert.equal(this.value, 13)  /// this assertion throws
    });

  });

});
