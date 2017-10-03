const test = require('tape')
const { composeBundles, composeBundlesRaw, appTimeBundle } = require('../')

test('composeBundles', (t) => {
  const createStore = composeBundles()
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  t.end()
})

test('makes selectors available to thunk actions', (t) => {
  const store = composeBundles()()
  store.dispatch(({dispatch, getState, store: { selectAppTime }}) => {
    t.ok(getState)
    t.ok(dispatch)
    t.ok(selectAppTime())
    t.end()
  })
})

test('composeBundlesRaw', t => {
  const createStore = composeBundlesRaw(appTimeBundle)
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  const store = createStore()
  t.equal(typeof store.selectAppTime(), 'number', 'attached bound selectors')
  t.end()
})
