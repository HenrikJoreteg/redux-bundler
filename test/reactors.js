const test = require('tape')
const { composeBundlesRaw, reactorsBundle } = require('../dist/redux-bundler')

const ACTION_0 = 'ACTION_0'
const ACTION_1 = 'ACTION_1'

const bundleWithReactors = {
  name: 'reactionary',
  reducer: (state = { started: false, a0: false, a1: false }, action) => {
    if (action.type === 'START') {
      return Object.assign({}, state, { started: true })
    }
    if (action.type === ACTION_0) {
      return Object.assign({}, state, { a0: true })
    }
    if (action.type === ACTION_1) {
      return Object.assign({}, state, { a1: true })
    }
    return state
  },
  doAction1: () => ({ type: ACTION_1 }),
  reactShouldReact0: state => {
    if (state.reactionary.started && !state.reactionary.a0) {
      return { type: ACTION_0 }
    }
  },
  reactShouldReact1: state => {
    if (state.reactionary.started && !state.reactionary.a1) {
      return { actionCreator: 'doAction1' }
    }
  }
}

test('reactorsBundle', t => {
  const store = composeBundlesRaw(bundleWithReactors, reactorsBundle())()
  store.subscribe(() => {
    count++
  })
  let count = 0
  t.equal(count, 0)
  store.dispatch({ type: 'START' })
  t.deepEqual(store.getState().reactionary, {
    started: true,
    a0: false,
    a1: false
  })
  t.equal(count, 1)
  setTimeout(() => {
    t.equal(count, 2, 'should now have ran twice')
    t.deepEqual(
      store.getState().reactionary,
      { started: true, a0: true, a1: false },
      'more state changes should have occured'
    )
    setTimeout(() => {
      t.equal(count, 3, 'should now have ran thrice')
      t.deepEqual(
        store.getState().reactionary,
        { started: true, a0: true, a1: true },
        'all state changes should have occured'
      )
      t.end()
    }, 0)
  }, 0)
})
