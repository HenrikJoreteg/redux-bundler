const test = require('tape')
const {
  composeBundlesRaw,
  createCacheBundle
} = require('../../dist/redux-bundler')

const getTestBundle = (number, startingState = {}, persistActions) => ({
  name: `test${number}`,
  persistActions: persistActions || [`DO_THING_${number}`],
  reducer: (state = startingState) => state,
  [`selectState${number}`]: state => state,
  [`doThing${number}`]: payload => ({ type: `DO_THING_${number}`, payload }),
  [`doSomething${number}`]: () => ({ type: `DO_SOMETHING_${number}` })
})

test('createCacheBundle', t => {
  let count = 0
  const store = composeBundlesRaw(
    createCacheBundle({
      enabled: true,
      cacheFn: (reducerName, valueToPersist) => {
        count++

        if (count === 1) {
          t.equal(reducerName, 'test1', 'reducer name should match')
          t.deepEqual(valueToPersist, {}, 'value to persist is state')
        }

        if (count === 2) {
          t.equal(reducerName, 'test1', 'reducer name should match')
          t.deepEqual(valueToPersist, {}, 'value to persist is state')
        }

        if (count === 3) {
          t.equal(reducerName, 'test2', 'reducer name should match')
          t.deepEqual(
            valueToPersist,
            { stuff: 1 },
            'value to persist is from second one'
          )
        }

        if (count === 4) {
          t.equal(reducerName, 'test1', 'reducer name should match')
          t.deepEqual(valueToPersist, {}, 'value to persist is first')
        }

        if (count === 5) {
          t.equal(reducerName, 'test3', 'reducer name should match')
          t.deepEqual(
            valueToPersist,
            { stuff: 3 },
            'value to persist is from third'
          )
          t.end()
        }

        return Promise.resolve()
      }
    }),
    getTestBundle(1)
  )()

  // triggering should cause a persist
  store.doThing1()

  t.deepEqual(
    store.meta.persistActionMap,
    { DO_THING_1: ['test1'] },
    'correct action map should exist on store'
  )

  // integrate second bundle, make sure existing and new both work
  store.integrateBundles(getTestBundle(2, { stuff: 1 }))

  store.doThing1()
  store.doThing2()

  t.deepEqual(
    store.meta.persistActionMap,
    {
      DO_THING_1: ['test1'],
      DO_THING_2: ['test2']
    },
    'first should be present still, along with second'
  )

  // integrate a third that shares a persist action with previously integrated
  store.integrateBundles(getTestBundle(3, { stuff: 3 }, ['DO_THING_1']))

  t.deepEqual(
    store.meta.persistActionMap,
    {
      DO_THING_1: ['test1', 'test3'],
      DO_THING_2: ['test2']
    },
    'the DO_THING_1 action should now have both'
  )

  store.doThing1()
})

test('createCacheBundle logger option', t => {
  const store = composeBundlesRaw(
    createCacheBundle({
      enabled: true,
      cacheFn: () => Promise.resolve(),
      logger: message => {
        t.equal(message, 'cached test1 due to DO_THING_1')
        t.end()
      }
    }),
    getTestBundle(1)
  )()

  // triggering should cause a persist
  store.doThing1()
})
