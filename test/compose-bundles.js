const test = require('tape')
const { composeBundles } = require('../')

test('composeBundles', (t) => {
  const createStore = composeBundles()
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  t.end()
})
