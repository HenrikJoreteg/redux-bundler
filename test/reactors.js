const test = require('tape')
const { composeBundlesRaw, reactorsBundle } = require('../')

const ACTION_0 = 'ACTION_0'
const ACTION_1 = 'ACTION_1'
const ACTION_2 = 'ACTION_2'

const bundleWithReactors = {
  name: 'reactionary',
  reactors: ['selectShouldReact0', 'selectShouldReact1', 'selectShouldReact2'],
  reducer: (state = {started: false, a0: false, a1: false, a2: false}, action) => {
    if (action.type === 'START') {
      return Object.assign({}, state, {started: true})
    }
    if (action.type === ACTION_0) {
      return Object.assign({}, state, {a0: true})
    }
    if (action.type === ACTION_1) {
      return Object.assign({}, state, {a1: true})
    }
    if (action.type === ACTION_2) {
      return Object.assign({}, state, {a2: true})
    }
    return state
  },
  doAction2: () => ({type: ACTION_2}),
  selectShouldReact0: state => {
    if (state.reactionary.started && !state.reactionary.a0) {
      return { type: ACTION_0 }
    }
  },
  selectShouldReact1: state => {
    if (state.reactionary.started && !state.reactionary.a1) {
      return () => ({ type: ACTION_1 })
    }
  },
  selectShouldReact2: state => {
    if (state.reactionary.started && !state.reactionary.a2) {
      return { actionCreator: 'doAction2' }
    }
  }
}

test('reactorsBundle', (t) => {
  const store = composeBundlesRaw(bundleWithReactors, reactorsBundle())()
  store.subscribe(() => {
    count++
  })
  let count = 0
  t.equal(count, 0)
  store.dispatch({type: 'START'})
  t.deepEqual(store.getState().reactionary, {started: true, a0: false, a1: false, a2: false})
  t.equal(count, 1)
  setTimeout(() => {
    t.equal(count, 2, 'should now have ran twice')
    t.deepEqual(store.getState().reactionary, {started: true, a0: true, a1: true, a2: true}, 'all state changes should have occured')
    t.end()
  }, 0)
})
