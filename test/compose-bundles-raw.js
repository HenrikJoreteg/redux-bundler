const test = require('tape')
const { composeBundlesRaw, appTimeBundle, asyncCountBundle } = require('../')

test('composeBundlesRaw', t => {
  const createStore = composeBundlesRaw(appTimeBundle)
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  const store = createStore()
  t.equal(typeof store.selectAppTime(), 'number', 'attached bound selectors')
  t.end()
})

test('integrateBundles', t => {
  const store = composeBundlesRaw(appTimeBundle)()
  t.ok(store.selectAppTime, 'has app time')
  t.ok(!store.selectAsyncActive, `doesn't have async active yet`)
  store.integrateBundles(asyncCountBundle)
  t.ok(store.selectAppTime, `old selector is still there`)
  t.ok(store.selectAsyncActive, `has new selector now too`)
  t.end()
})
