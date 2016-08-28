const debounce = require('lodash/debounce')
const requestIdleCallback = require('ric-shim')
const IS_BROWSER = typeof window !== 'undefined'
const raf =
  (IS_BROWSER && require('component-raf')) ||
  ((func) => { setTimeout(func, 0) })

const defaults = {
  idleTimeout: 30000,
  idleAction: 'APP_IDLE'
}

const createBundle = (opts) => ({
  name: 'reactiveDispatch',
  extract: 'effects',
  init: (store, effects = []) => {
    opts || (opts = {})
    Object.assign(opts, defaults)
    const { idleAction, idleTimeout } = opts
    const idleDispatcher = debounce(() => {
      raf(() => store.dispatch({type: idleAction}))
    }, idleTimeout)

    // flatten
    effects = effects.reduce((acc, effectArr) => acc.concat(effectArr), [])

    // convert any string refereces into real functions
    effects.forEach(effect => {
      effect.actionCreators = typeof effect.actionCreators === 'string'
        ? store[effect.actionCreators]
        : effect.actionCreators
      effect.selector = typeof effect.selector === 'string'
        ? store[effect.selector]
        : effect.selector
    })

    const runChecks = () => {
      effects
        .filter(item => item.selector(store.getState()) !== null)
        .forEach(item => {
          requestIdleCallback(() => {
            // make sure it's still relevant
            const result = item.selector(store.getState())
            if (result !== null) {
              store.dispatch(item.actionCreator(result))
            }
          })
        })
    }

    const callback = () => {
      runChecks()
      idleDispatcher()
    }

    store.subscribe(callback)
    callback()
  }
})

module.exports = createBundle()
module.exports.createBundle = createBundle
