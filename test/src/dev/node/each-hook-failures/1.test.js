#!/usr/bin/env node
'use strict'

const suman = require('suman')
const {Test} = suman.init(module, {}, {
  // series: false
  allowSkip: true
})

///////////////////////////////////////////////////////////////////////

Test.define('Mo-Rific', v => {

  v.inject('age', 'age', 'age')
  .run((b, before, beforeEach, it) => {

    beforeEach(h => {
      throw new Error('bubbles')
    });

    it('is cool', t => {

    })

  })
  .run((b, before, beforeEach, it) => {

    it('is cool', t => {

    })

  })

})
