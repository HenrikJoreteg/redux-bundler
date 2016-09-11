const test = require('tape')
const { composeBundles, appTimeBundle } = require('../')

test('composeBundles', (t) => {
  const createStore = composeBundles(appTimeBundle)
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  const store = createStore()
  t.equal(typeof store.selectAppTime(), 'number', 'attached bound selectors')
  t.end()
})
