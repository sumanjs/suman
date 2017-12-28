describe('before/after with data-driven tests', () => {
  before(() => console.log('before worked'))
  beforeEach(() => console.log('beforeEach worked'))
  afterEach(() => console.log('afterEach worked'))
  after(() => console.log('after worked'));
    [ 'foo' ].forEach((item) => {
    it(`works for item ${item}`, () => {
      console.log('item is', item)
    })
  })
})
