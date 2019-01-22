const test = require('tape')
const { composeBundlesRaw } = require('../dist/redux-bundler')

test('replace state', t => {
  const stuffBundle = {
    name: 'stuff',
    reducer: (state = 'initialValue') => state,
    selectStuff: state => state.stuff
  }
  const otherBundle = {
    name: 'other',
    reducer: (state = 'initialOtherValue') => state,
    selectOther: state => state.other
  }

  const store = composeBundlesRaw(stuffBundle, otherBundle)({
    stuff: 'startingStuff'
  })

  store.dispatch({
    type: 'REPLACE_STATE',
    payload: { other: 'positive' }
  })

  t.deepEqual(
    store.getState(),
    { stuff: 'initialValue', other: 'positive' },
    'should have initial values from reducers not included in replace'
  )
  t.end()
})
