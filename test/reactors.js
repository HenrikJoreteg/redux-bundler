const test = require('tape')
const { composeBundlesRaw, reactorsBundle } = require('../')

const bamAction = 'ACTION'

const bundleWithReactors = {
  name: 'reactionary',
  reactors: ['selectShouldReact'],
  reducer: (state = false, action) => {
    if (action.type === bamAction) {
      return true
    }
    return state
  },
  selectIsAwesome: state => state.reactionary,
  selectShouldReact: state => {
    if (state.reactionary) return null
    return { type: bamAction }
  }
}

test('reactorsBundle', (t) => {
  const store = composeBundlesRaw(bundleWithReactors, reactorsBundle())()
  t.ok(store)
  t.ok(store.selectShouldReact)
  t.end()
})
