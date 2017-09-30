const test = require('tape')
const { composeBundles } = require('../')

test('batch dispatch', (t) => {
  const bundle = {
    name: 'batch',
    reducer: (state = {}, {type, payload}) => {
      if (type === 'ACTION1') {
        return Object.assign({}, state, {no1: true})
      }
      if (type === 'ACTION2') {
        return Object.assign({}, state, {no2: true})
      }
      if (type === 'ACTION3') {
        return Object.assign({}, state, {no3: true})
      }
      return state
    }
  }

  let count = 0
  const store = composeBundles(bundle)()
  store.subscribe(() => {
    count++
  })
  store.dispatch({type: 'ACTION1'}, {type: 'ACTION2'}, {type: 'ACTION3'})
  t.equal(count, 1)
  console.log(store.getState())
  t.deepEqual(store.getState().batch, {no1: true, no2: true, no3: true}, 'Ok')
  t.end()
})
