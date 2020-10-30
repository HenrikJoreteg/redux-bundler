const test = require('tape')
const {
  composeBundlesRaw,
  createReactorBundle
} = require('../dist/redux-bundler')

const ACTION_0 = 'ACTION_0'
const ACTION_1 = 'ACTION_1'

const bundleWithReactors = {
  name: 'reactionaryBundle',
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
    if (state.reactionaryBundle.started && !state.reactionaryBundle.a0) {
      return { type: ACTION_0 }
    }
  },
  reactShouldReact1: state => {
    if (state.reactionaryBundle.started && !state.reactionaryBundle.a1) {
      return { actionCreator: 'doAction1' }
    }
  }
}

test('createReactorBundle', t => {
  const store = composeBundlesRaw(bundleWithReactors, createReactorBundle(), {
    name: 'testObserver',
    getMiddleware: () => {
      let count = 0
      return store => next => action => {
        count++
        if (count === 1) {
          t.deepEqual(action, { type: 'START' }, 'first action should be start')
          return next(action)
        }
        if (count === 2) {
          t.deepEqual(action, { type: 'ACTION_0' })
          return next(action)
        }
        if (count === 3) {
          t.deepEqual(action, { type: 'ACTION_1' })
          const result = next(action)
          t.deepEqual(
            store.getState().reactionaryBundle,
            { started: true, a0: true, a1: true },
            'all state changes should have occured'
          )
          t.end()
          return result
        }
        if (count > 3) {
          t.fail('should not get here')
        }
      }
    }
  })()

  store.dispatch({ type: 'START' })
})

test('ability to disable reactors', t => {
  let hasRunOnce = false

  const bundle = {
    name: 'reactionaryBundle',
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
      if (state.reactionaryBundle.started) {
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

  const shouldMatch = ({ started, timesRan }, message) => {
    t.deepEqual(
      store.getState().reactionaryBundle,
      {
        started,
        timesRan
      },
      message
    )
  }

  t.ok(!store.nextReaction)

  shouldMatch({ started: false, timesRan: 0 }, 'should not have ran yet')

  // dispatch thing that should start reactor
  store.dispatch({ type: 'START' })
  // make sure we have reactor
  t.ok(store.nextReaction)
  shouldMatch({ started: true, timesRan: 0 })

  const waitForNoPendingReactor = () =>
    new Promise(resolve => {
      const check = () => {
        if (store.nextReaction) {
          setTimeout(check, 10)
        } else {
          resolve()
        }
      }
      check()
    })
  // give reactors a chance to run
  waitForNoPendingReactor().then(() => {
    shouldMatch({ started: true, timesRan: 1 }, 'should have ran once')

    store.dispatch({ type: 'START' })
    t.ok(!store.nextReaction)
    setTimeout(() => {
      shouldMatch({ started: true, timesRan: 1 })
      t.end()
    })
  })
})
