const test = require('tape')
const { composeBundles, appTimeBundle } = require('../')

test('composeBundles', (t) => {
  const createStore = composeBundles(appTimeBundle)
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  const store = createStore()
  t.equal(store.getState().appTime, store.selectAppTime(), 'returns time')
  t.end()
})
