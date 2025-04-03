const test = require('tape')
const {
  composeBundlesRaw,
  createDebugBundle
} = require('../dist/redux-bundler')

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

test('sets stack trace limit', t => {
  const store = composeBundlesRaw(
    createDebugBundle({
      stackTraceLimit: 50
    }),
    {
      name: 'other',
      doSomething: () => {},
      selectSomething: () => true,
      reactToSomething: () => {}
    }
  )()

  const initialStackTraceLimit = Error.stackTraceLimit

  store.doEnableDebug()

  t.equal(Error.stackTraceLimit, 50, 'should set stack trace limit to 50')

  store.doDisableDebug()

  t.equal(
    Error.stackTraceLimit,
    initialStackTraceLimit,
    'should reset stack trace limit'
  )

  // Should not override the stack trace limit if it has been set elsewhere to
  // something other than the default
  Error.stackTraceLimit = 123
  store.doEnableDebug()
  t.equal(Error.stackTraceLimit, 123, 'does not override limit if has been set')
  store.doDisableDebug()
  t.equal(Error.stackTraceLimit, 123, 'does not override limit if has been set')

  t.end()
})
