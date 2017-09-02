const test = require('tape')
const { createSelector } = require('create-selector')
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
  t.ok(store.selectAppTime(), `old selector works`)
  t.ok(store.selectAsyncActive, `has new selector now too`)
  t.ok(store.selectAsyncActive, `new selector works`)
  t.end()
})

test('resolves selectors appropriately', t => {
  const thingIdentifySelector = state => state.thing

  const testBundle1 = {
    name: 'thing',
    selectSomething: createSelector(
      thingIdentifySelector,
      id => id
    )
  }

  const testBundle2 = {
    name: 'other',
    selectOther: createSelector(
      'selectSomething',
      something => something
    )
  }

  const store = composeBundlesRaw(
    testBundle1,
    testBundle2
  )({thing: 'hi'})

  t.ok(store.selectSomething, 'has selectSomething')
  t.equal(store.selectSomething(), 'hi', 'selectSomething works')
  t.ok(store.selectOther, 'has selectOther')
  t.equal(store.selectOther(), 'hi', 'selectOther works')
  t.end()
})
