const test = require('tape')
const {
  composeBundlesRaw,
  createDebugBundle
} = require('../../dist/redux-bundler')

test('create debug bundle basics', t => {
  const store = composeBundlesRaw(createDebugBundle(), {
    name: 'other',
    doSomething: () => {},
    selectSomething: () => true,
    reactToSomething: () => {}
  })()

  t.equal(store.selectIsDebug(), false, 'should always start out false on node')

  store.doLogDebugSummary()

  t.ok(store.doLogDebugSummary, 'exists')
  t.end()
})
