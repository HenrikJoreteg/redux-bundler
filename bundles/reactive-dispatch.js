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
    const effectObj = effects.reduce((acc, effectObj) => {
      for (const item in effectObj) {
        // helpful development errors
        if (process.env.NODE_ENV !== 'production') {
          const actionName = effectObj[item]
          if (!store[item]) {
            throw Error(`Effect key '${item}' does not exist on the store. Make sure you're defining as selector by that name.`)
          }
          if (!store[actionName]) {
            throw Error(`Effect value '${actionName}' does not exist on the store. Make sure you're defining an action creator by that name.`)
          }
          if (acc[item]) {
            throw Error(`effect keys must be unique. An effect ${item} is already defined`)
          }
          if (typeof actionName !== 'string') {
            throw Error(`Effect values must be strings. The effect ${item} has a value that is: ${typeof actionName}`)
          }
        }
        acc[item] = effectObj[item]
      }
      return acc
    }, {})

    store.effects = effectObj
    store.activeEffectQueue = []

    const buildActiveEffectQueue = () => {
      for (const selectorName in store.effects) {
        const result = store[selectorName]()
        if (result !== null && store.activeEffectQueue.indexOf(selectorName) === -1) {
          store.activeEffectQueue.push(selectorName)
        }
      }
    }

    const dispatchNext = () => {
      requestIdleCallback(() => {
        const next = store.activeEffectQueue.shift()
        if (next) {
          // make sure it's still relevant
          const result = store[next]()
          if (result !== null) {
            const actionCreatorName = store.effects[next]
            store[actionCreatorName](result)
          }
        }
      })
    }

    const callback = () => {
      buildActiveEffectQueue()
      dispatchNext()
      idleDispatcher()
    }

    store.subscribe(callback)
    callback()
  }
})

module.exports = createBundle()
module.exports.createBundle = createBundle
