const test = require('tape')
const {
  composeBundles,
  composeBundlesRaw,
  appTimeBundle
} = require('../dist/redux-bundler')

test('composeBundles', t => {
  const createStore = composeBundles()
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  t.end()
})

test('makes selectors available to thunk actions', t => {
  const store = composeBundles()()
  store.dispatch(({ dispatch, getState, store: { selectAppTime } }) => {
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

test('ensure dispatch returns what the thunk function returns', t => {
  const store = composeBundles()()
  const result = store.dispatch(({ dispatch }) => {
    return true
  })
  t.equal(result, true, 'should return true')
  t.end()
})

test('ensure getExtraArgs has access to store and is available to dispatched function actions', t => {
  const extraThing = {}
  let passedStore
  const store = composeBundles({
    name: 'extra',
    getExtraArgs: thePassedStore => {
      passedStore = thePassedStore
      return { extraThing }
    }
  })()
  t.equal(store, passedStore, 'has access to store')
  store.dispatch(args => {
    t.equal(args.extraThing, extraThing, 'is available to dispatched functions')
    t.end()
  })
})
