const test = require('tape')
const { composeBundles } = require('../')

test('selectAll', (t) => {
  const store = composeBundles()()
  t.equal(typeof store.selectAll(), 'object', 'returns object')
  t.end()
})
