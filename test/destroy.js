const test = require('tape')
const { composeBundles, composeBundlesRaw } = require('../dist/redux-bundler')

const countBundle = {
  name: 'count',
  selectCount: state => state.count,
  reducer: (state = 0, { type }) => (type === 'INC' ? state + 1 : state)
}

test('makes destroy available to store', t => {
  const createStore = composeBundles()
  t.equal(typeof createStore().destroy, 'function', 'destroy is a function')
  t.end()
})

test('calls destroy with store', t => {
  const store = composeBundlesRaw({
    ...countBundle,
    destroy (store) {
      store.destroyed = true
    }
  })()
  t.equal(store.destroyed, undefined)

  store.destroy()

  t.equal(store.destroyed, true)

  t.end()
})

test('calls return of init as the destroy of store', t => {
  let count = 0
  const store = composeBundlesRaw({
    ...countBundle,
    init (store) {
      // being explicit here for documentation purposes
      const unsubscribe = store.subscribe(() => {
        count++
      })

      return () => {
        unsubscribe()
      }
    }
  })()

  t.equal(count, 0)

  store.dispatch({ type: 'INC' })
  t.equal(store.selectCount(), 1)
  t.equal(count, 1)

  store.destroy()

  store.dispatch({ type: 'INC' })
  t.equal(store.selectCount(), 2)
  t.equal(count, 1, 'destroy should have unsubscribed')

  t.end()
})
