const test = require('tape')
const { createSelector } = require('create-selector')
const {
  composeBundles,
  composeBundlesRaw,
  asyncCountBundle,
  appTimeBundle
} = require('../dist/redux-bundler')

test('integrateBundles', t => {
  const store = composeBundlesRaw(appTimeBundle)()
  t.ok(store.selectAppTime, 'has app time')
  t.ok(!store.selectAsyncActive, "doesn't have async active yet")
  store.integrateBundles(asyncCountBundle)
  t.ok(store.selectAppTime, 'old selector is still there')
  t.ok(store.selectAppTime(), 'old selector works')
  t.ok(store.selectAsyncActive, 'has new selector now too')
  t.ok(store.selectAsyncActive, 'new selector works')
  t.end()
})

test('integrateBundles reactors', t => {
  const starterBundle = {
    name: 'starter',
    reducer: (state = { done: false }, action) => {
      if (action.type === 'DO_THING') {
        return Object.assign({}, state, { done: true })
      }
      if (action.type === 'DO_UNDO_THING') {
        return Object.assign({}, state, { done: false })
      }
      return state
    },
    selectIsDone: state => state.starter.done,
    doThing: () => ({ type: 'DO_THING' }),
    doUndoThing: () => ({ type: 'DO_UNDO_THING' })
  }

  const reactorBundle = {
    name: 'reactionary',
    reducer: (state = { flipped: false }, action) => {
      if (action.type === 'FLIP') {
        return Object.assign({}, state, { flipped: action.payload })
      }
      return state
    },
    reactShouldFlipDown: createSelector(
      'selectIsFlippedUp',
      flipped => flipped && { type: 'FLIP', payload: false }
    ),
    doFlipUp: () => ({ type: 'FLIP', payload: true }),
    selectIsFlippedUp: state => state.reactionary.flipped
  }

  // first start with a single bundle check basics
  const store = composeBundles(starterBundle)()
  t.equal(store.selectIsDone(), false, 'is not done')

  // grab instance of doThing for comparison
  const { doThing } = store
  doThing()
  t.equal(store.selectIsDone(), true, 'is done')

  // next integrate new bundle
  store.integrateBundles(reactorBundle)

  // make sure things are as expected with new merged store
  t.equal(
    store.doThing,
    doThing,
    'instance of bound action creator has not been replaced'
  )
  t.equal(
    store.selectIsDone(),
    true,
    'should still have kept state of original'
  )
  t.equal(
    store.selectIsFlippedUp(),
    false,
    'should have gotten initial state for new bundle added later'
  )
  store.doFlipUp()

  t.equal(store.selectIsFlippedUp(), true, 'is flipped up per first action')
  t.equal(store.selectIsDone(), true, 'is still marked as done')
  t.equal(
    store.activeReactor,
    'reactShouldFlipDown',
    'active reactor should be on store'
  )

  // give the reactor a chance to finish
  setTimeout(() => {
    t.equal(store.selectIsFlippedUp(), false, 'is flipped')
    t.equal(store.selectIsDone(), true, 'is still done')
    t.equal(store.activeReactor, null, 'active reactor should be null')
    t.end()
  })
})

test('resolves selectors appropriately', t => {
  const thingIdentifySelector = state => state.thing

  const testBundle1 = {
    name: 'thing',
    selectSomething: createSelector(thingIdentifySelector, id => id)
  }

  const testBundle2 = {
    name: 'other',
    selectOther: createSelector('selectSomething', something => something)
  }

  const store = composeBundlesRaw(testBundle1, testBundle2)({ thing: 'hi' })

  t.ok(store.selectSomething, 'has selectSomething')
  t.equal(store.selectSomething(), 'hi', 'selectSomething works')
  t.ok(store.selectOther, 'has selectOther')
  t.equal(store.selectOther(), 'hi', 'selectOther works')
  t.end()
})
