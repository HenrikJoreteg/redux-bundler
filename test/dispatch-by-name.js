const test = require('tape')
const { composeBundlesRaw } = require('../')

test('.action() same as doAction', (t) => {
  let count = 0
  const store = composeBundlesRaw({
    name: 'test',
    reducer: (state = {}) => state,
    selectState: state => state,
    doThing: payload => ({type: 'DO_THING', payload}),
    doSomething: () => ({type: 'DO_SOMETHING'}),
    getMiddleware: () =>
      ({getState}) => (next) => (action) => {
        count++
        if (count === 1) {
          t.deepEqual(action, {type: 'DO_THING', payload: 1})
        }
        if (count === 2) {
          t.deepEqual(action, {type: 'DO_THING', payload: 1})
        }
        if (count === 3) {
          t.deepEqual(action, {type: 'DO_SOMETHING'})
        }
        if (count === 4) {
          t.deepEqual(action, {type: 'DO_SOMETHING'})
          t.end()
        }
        return next(action)
      }
  })()

  store.action('doThing', [1])
  store.doThing(1)

  store.action('doSomething')
  store.doSomething()
})
