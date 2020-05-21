const test = require('tape')
const {
  composeBundlesRaw,
  createReactorBundle
} = require('../dist/redux-bundler')

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

test('createReactorBundle', t => {
  const store = composeBundlesRaw(bundleWithReactors, createReactorBundle())()
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

test('ability to disable reactors', t => {
  let hasRunOnce = false

  const bundle = {
    name: 'reactionary',
    reducer: (state = { started: false, timesRan: 0 }, action) => {
      if (action.type === 'START') {
        return Object.assign({}, state, { started: true })
      }
      if (action.type === 'THE_ACTION') {
        return Object.assign({}, state, { timesRan: state.timesRan + 1 })
      }
      return state
    },
    doAction: () => ({ type: 'THE_ACTION' }),
    reactShouldReact: state => {
      if (state.reactionary.started) {
        return { actionCreator: 'doAction' }
      }
    }
  }

  const store = composeBundlesRaw(
    bundle,
    createReactorBundle({
      reactorPermissionCheck: name => {
        if (name === 'reactShouldReact') {
          if (hasRunOnce) {
            return false
          }
          hasRunOnce = true
          return true
        }
        return true
      }
    })
  )()

  const shouldMatch = ({ started, timesRan }) => {
    t.deepEqual(store.getState().reactionary, {
      started,
      timesRan
    })
  }

  t.ok(!store.nextReaction)

  shouldMatch({ started: false, timesRan: 0 })

  // dispatch thing that should start reactor
  store.dispatch({ type: 'START' })
  // make sure we have reactor
  t.ok(store.nextReaction)
  shouldMatch({ started: true, timesRan: 0 })

  // give reactors a chance to run
  setTimeout(() => {
    shouldMatch({ started: true, timesRan: 1 })
    store.dispatch({ type: 'START' })
    // make sure we no longer have pending reactor
    t.ok(!store.nextReaction)
    setTimeout(() => {
      shouldMatch({ started: true, timesRan: 1 })
      t.end()
    })
  })
})
