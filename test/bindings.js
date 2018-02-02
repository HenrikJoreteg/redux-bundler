const test = require('tape')
const { composeBundlesRaw } = require('../')
const { createSelector } = require('create-selector')

const getStore = composeBundlesRaw(
  {
    name: 'trueBundle',
    reducer: (state = true, { type, payload }) => {
      if (type === 'MAKE_FALSE') {
        return false
      }
      if (type === 'MAKE_TRUE') {
        return true
      }
      return state
    },
    selectIsTrue: state => state.trueBundle
  },
  {
    name: 'numberBundle',
    reducer: (state = 0, { type, payload }) => {
      if (type === 'INCREMENT') {
        return state + 1
      }
      if (type === 'DECREMENT') {
        return state - 1
      }
      return state
    },
    selectNumber: state => state.numberBundle,
    selectIsPositive: createSelector('selectNumber', number => number > 0)
  }
)

test('bindings errors', t => {
  const store = getStore()
  t.equal(store.selectIsPositive(), false, 'not positive')
  t.deepEqual(store.subscriptions.watchedValues, {})
  t.throws(
    () => {
      store.subscribeToSelectors(['doesNotExist'])
    },
    /SelectorNotFound/,
    'should error if trying to subscribe to missing things'
  )
  t.end()
})

test('bindings basic functionality', t => {
  const store = getStore()
  store.subscribeToSelectors(['selectIsPositive', 'selectIsTrue'], changes => {
    t.deepEqual(
      changes,
      { isPositive: true },
      'there should only be this one change'
    )
    t.end()
  })
  t.deepEqual(store.subscriptions.watchedValues, {
    isPositive: false,
    isTrue: true
  })
  store.dispatch({ type: 'INCREMENT' })
  t.deepEqual(store.subscriptions.watchedValues, {
    isPositive: true,
    isTrue: true
  })
  t.equal(store.selectIsPositive(), true, 'now it is positive')
})

test('bindings select all functionality', t => {
  const store = getStore()

  let count = 0
  store.subscribeToAllChanges(changes => {
    count++
    if (count === 1) {
      t.deepEqual(
        changes,
        { isPositive: true, number: 1 },
        'first instance of all callback should have isPositive and number only'
      )
    } else if (count === 2) {
      t.deepEqual(changes, { isTrue: false })
      t.end()
    }
  })

  store.subscribeToSelectors(['selectIsPositive', 'selectNumber'], changes => {
    t.deepEqual(
      changes,
      { isPositive: true, number: 1 },
      'there should only be this one change'
    )
  })
  t.deepEqual(store.subscriptions.watchedValues, {
    isPositive: false,
    isTrue: true,
    number: 0
  })
  store.dispatch({ type: 'INCREMENT' })
  t.deepEqual(store.subscriptions.watchedValues, {
    isPositive: true,
    isTrue: true,
    number: 1
  })
  t.equal(store.selectIsPositive(), true, 'now it is positive')

  // this should do nothing
  store.dispatch({ type: 'MAKE_TRUE' })

  // this should actually cause the change
  store.dispatch({ type: 'MAKE_FALSE' })
})
