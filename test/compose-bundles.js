const test = require('tape')
const { composeBundles } = require('../')

test('composeBundles', (t) => {
  const createStore = composeBundles()
  t.equal(typeof createStore, 'function', 'returns a function')
  t.ok(createStore().getState, 'is a redux store')
  t.end()
})

test('makes selectors available to thunk actions', (t) => {
  const store = composeBundles()()
  store.dispatch(({dispatch, getState, selectUrlObject}) => {
    t.ok(getState)
    t.ok(dispatch)
    t.ok(selectUrlObject().href)
    t.end()
  })
})
