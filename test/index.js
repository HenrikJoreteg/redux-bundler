const test = require('tape')
const { composeBundles } = require('../')
const appTimeBundle = require('../bundles/app-time')

test('composeBundles', (t) => {
  const createStore = composeBundles(appTimeBundle)
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  const store = createStore()
  t.equal(store.selectAppTime(), store.getState().appTime, 'returns time')
  t.end()
})
