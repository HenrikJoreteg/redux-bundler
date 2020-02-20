const test = require('tape')
const moduleAlias = require('module-alias')
const path = require('path')
moduleAlias.addAlias(
  'redux-bundler',
  path.join(__dirname, '/../dist/redux-bundler')
)
moduleAlias.addAlias(
  'redux-bundler',
  path.join(__dirname, '/../dist/redux-bundler')
)
const onlineBundle = require('../dist/online-bundle')
const {
  createSelector,
  createReactorBundle,
  composeBundlesRaw
} = require('../dist/redux-bundler')
const createAsyncResourceBundle = require('../dist/create-async-resource-bundle')

const getAsyncBundleStore = (result, bundleOptions) =>
  composeBundlesRaw(
    {
      name: 'appTime',
      reducer: (state = Date.now()) => state,
      selectAppTime: state => state.appTime
    },
    onlineBundle,
    createAsyncResourceBundle(
      Object.assign(
        {},
        {
          name: 'user',
          getPromise: () =>
            result instanceof Error
              ? Promise.reject(result)
              : Promise.resolve(result)
        },
        bundleOptions
      )
    )
  )

const getDispatchStub = (t, expected) => {
  let count = 0
  return action => {
    t.deepEqual(
      action,
      expected[count],
      `dispatches correct action ${action.type}`
    )
    count++
  }
}

test('createAsyncResourceBundle basics', t => {
  const store = getAsyncBundleStore({ name: 'henrik' })()
  t.ok(store.selectUserShouldUpdate, 'creates a should update selector')
  t.ok(store.doFetchUser, 'creates an action creator for fetching')
  t.end()
})

test('createAsyncResourceBundle action creator success dispatches', t => {
  const store = getAsyncBundleStore({ name: 'henrik' })()
  store.dispatch = getDispatchStub(t, [
    { type: 'USER_FETCH_STARTED' },
    { type: 'USER_FETCH_FINISHED', payload: { name: 'henrik' } }
  ])

  const promise = store.doFetchUser()
  t.ok(promise.then, 'calling the thunk will return a promise')

  // this will allow second dispatch to occur
  setTimeout(() => {
    t.end()
  }, 0)
})

test('createAsyncResourceBundle should update selector', t => {
  const store = getAsyncBundleStore(0)() // <- e.g. user id 0
  t.equal(store.selectUser(), null, "shouldn't have data")
  t.equal(store.selectUserShouldUpdate(), true, 'should update w/o data')
  store.doFetchUser()

  // wait for fetch to finish
  setTimeout(() => {
    t.equal(store.selectUser(), 0, 'should have data')
    t.equal(
      store.selectUserShouldUpdate(),
      false,
      "shouldn't update with fresh data"
    )
    t.end()
  }, 0)
})

test('createAsyncResourceBundle custom actionBaseType', t => {
  const store = getAsyncBundleStore(
    { name: 'gregg' },
    { actionBaseType: 'NOTNAME' }
  )()
  store.dispatch = getDispatchStub(t, [
    { type: 'NOTNAME_FETCH_STARTED' },
    { type: 'NOTNAME_FETCH_FINISHED', payload: { name: 'gregg' } }
  ])
  store.doFetchUser()

  // this will allow second dispatch to occur
  setTimeout(() => {
    t.end()
  }, 0)
})

test('createAsyncResourceBundle checks for required options', t => {
  t.throws(() => getAsyncBundleStore({}, { name: null }))
  t.throws(() => getAsyncBundleStore({}, { getPromise: null }))
  t.doesNotThrow(() => getAsyncBundleStore({}, { actionBaseType: null }))
  t.end()
})

test('createAsyncResourceBundle action creator error dispatches', t => {
  const err = new Error('boom')
  const store = getAsyncBundleStore(err)()

  store.dispatch = getDispatchStub(t, [
    { type: 'USER_FETCH_STARTED' },
    { type: 'USER_FETCH_FAILED', error: err }
  ])

  store.doFetchUser()

  // this will allow second dispatch to occur
  setTimeout(() => {
    t.end()
  }, 0)
})

test('createAsyncResourceBundle handles waiting when failed properly', t => {
  const err = new Error('boom')
  let store = getAsyncBundleStore(err)({ user: { errorTimes: [12, 25] } })
  t.equal(store.selectUserLastError(), 25, 'plucks out last error')

  store = getAsyncBundleStore(err)({
    appTime: 600000,
    user: { errorTimes: [950, 999] }
  })
  t.equal(
    store.selectUserIsWaitingToRetry(),
    false,
    'is waiting to retry if within time'
  )
  store = getAsyncBundleStore(err)({
    appTime: 1000,
    user: { errorTimes: [950, 999] }
  })

  t.equal(
    store.selectUserIsWaitingToRetry(),
    true,
    'is not waiting to retry if error has passed'
  )
  t.end()
})

test('createAsyncResourceBundle doClear', t => {
  let store = getAsyncBundleStore({ name: 'henrik' })()

  t.deepEqual(store.selectUser(), null)
  store.doFetchUser()
  setTimeout(() => {
    t.deepEqual(store.selectUser(), { name: 'henrik' })
    store.doClearUser()
    t.deepEqual(store.selectUser(), null)
    t.end()
  }, 0)
})

test('createAsyncResourceBundle expireAfter support', t => {
  // setup a bundle
  const bundle = createAsyncResourceBundle({
    name: 'user',
    actionBaseType: 'USER',
    expireAfter: 200,
    getPromise: () => Promise.resolve({ name: 'henrik' })
  })
  bundle.reactShouldFetch = createSelector(
    bundle.selectUserShouldUpdate,
    shouldUpdate => {
      if (shouldUpdate) {
        return { actionCreator: 'doFetchUser' }
      }
    }
  )
  // use the bundle with modified appTime bundle
  // to let us pass in a start time.
  const createStore = composeBundlesRaw(
    {
      name: 'appTime',
      reducer: (state = Date.now()) => state,
      selectAppTime: state => state.appTime
    },
    onlineBundle,
    createReactorBundle({ idleTimeout: 200 }),
    bundle
  )
  // create an instance
  const store = createStore()

  // make sure it start out empty
  t.deepEqual(store.selectUser(), null, 'user is null to start')

  // give it time for the reactor to trigger
  setTimeout(() => {
    // should now have retrieved a user
    t.deepEqual(
      store.selectUser(),
      { name: 'henrik' },
      'use has now been fetched'
    )

    // grab populated state
    const state = store.getState()

    state.appTime = Date.now() + 100
    const newStore = createStore(state)

    const dispatch = newStore.dispatch

    let count = 0
    newStore.dispatch = arg => {
      count++

      if (count === 1) {
        t.deepEqual(arg, { type: 'USER_EXPIRED' }, 'should dispatch expired')
        // do actual dispatch
        dispatch(arg)
        t.equal(
          newStore.selectUserIsExpired(),
          true,
          'expired selector returns true'
        )
        return
      }
      if (count === 2) {
        t.deepEqual(
          arg,
          { actionCreator: 'doFetchUser' },
          'should have triggered refetch'
        )
        dispatch(arg)
        t.equal(
          newStore.selectUserIsExpired(),
          true,
          'expired selector still returns true'
        )
        return
      }
      if (count === 3) {
        t.deepEqual(
          arg,
          { type: 'USER_FETCH_STARTED' },
          'should trigger refetch'
        )
        dispatch(arg)
        t.equal(
          newStore.selectUserIsExpired(),
          true,
          'expired selector still returns true'
        )
        return
      }
      if (count === 4) {
        t.deepEqual(
          arg,
          { type: 'USER_FETCH_FINISHED', payload: { name: 'henrik' } },
          'fetch finished'
        )
        dispatch(arg)
        t.equal(
          newStore.selectUserIsExpired(),
          false,
          'expired selector still returns false'
        )
        t.end()
        return
      }

      t.fail('should never get here')
    }

    // wait
    setTimeout(() => {}, 0)
  }, 200)
})
