const test = require('tape')
const { createAsyncResourceBundle, composeBundlesRaw } = require('../')

const getAsyncBundle = (result) =>
  createAsyncResourceBundle({
    name: 'user',
    actionBaseType: 'FETCH_USER',
    getPromise: () => new Promise((resolve, reject) => {
      if (result instanceof Error) {
        reject(result)
      } else {
        resolve(result)
      }
    })
  })

const getDispatchStub = (t, expected) => {
  let count = 0
  return (action) => {
    t.deepEqual(action, expected[count], `dispatches correct action ${action.type}`)
    count++
  }
}

test('createAsyncResourceBundle basics', t => {
  const bundle = getAsyncBundle({name: 'henrik'})
  t.equal(bundle.name, 'user', 'creates a named bundle')
  t.ok(bundle.selectUserShouldUpdate, 'creates a should update selector')
  t.ok(bundle.doFetchUser, 'creates an action creator for fetching')
  t.end()
})

test('createAsyncResourceBundle action creator success dispatches', t => {
  const bundle = getAsyncBundle({name: 'henrik'})
  const thunk = bundle.doFetchUser()
  t.ok(thunk({dispatch: () => {}}).then, 'calling the thunk will return a promise')

  thunk({dispatch: getDispatchStub(t, [
    {type: 'FETCH_USER_START'},
    {type: 'FETCH_USER_SUCCESS', payload: {name: 'henrik'}}
  ])})

  // this will allow second dispatch to occur
  setTimeout(() => {
    t.end()
  }, 0)
})

test('createAsyncResourceBundle action creator error dispatches', t => {
  const err = new Error('boom')
  const bundle = getAsyncBundle(err)
  const thunk = bundle.doFetchUser()
  t.ok(thunk({dispatch: () => {}}).then, 'calling the thunk will return a promise')

  thunk({dispatch: getDispatchStub(t, [
    {type: 'FETCH_USER_START'},
    {type: 'FETCH_USER_ERROR', error: err}
  ])})

  // this will allow second dispatch to occur
  setTimeout(() => {
    t.end()
  }, 0)
})
