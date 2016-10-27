import debounce from 'lodash/debounce'
import requestIdleCallback from 'ric-shim'
import { IS_BROWSER, flattenExtractedToArray } from '../utils'
const raf =
  (IS_BROWSER && require('component-raf')) ||
  ((func) => { setTimeout(func, 0) })

const defaults = {
  idleTimeout: 30000,
  idleAction: 'APP_IDLE',
  doneCallback: null
}

export default (opts) => ({
  name: 'reactors',
  extract: 'reactors',
  init: (store, extracted) => {
    opts || (opts = {})
    Object.assign(opts, defaults)
    const { idleAction, idleTimeout } = opts
    const idleDispatcher = debounce(() => {
      raf(() => store.dispatch({type: idleAction}))
    }, idleTimeout)

    const reactorNames = flattenExtractedToArray(extracted)

    store.reactors = reactorNames

    if (process.env.NODE_ENV !== 'production') {
      reactorNames.forEach(name => {
        if (!store[name]) {
          throw Error(`Reactor '${name}' not found on the store. Make sure you're defining as selector by that name.`)
        }
      })
    }
    store.nextReaction = null

    const cancelIfDone = () => {
      if (!IS_BROWSER && !store.nextReaction && (!store.selectAsyncActive || !store.selectAsyncActive())) {
        idleDispatcher.cancel()
        opts.doneCallback && opts.doneCallback()
      }
    }

    const dispatchNext = () => {
      // one at a time
      if (store.nextReaction) {
        return
      }
      // look for the next one
      let action
      store.reactors.some(name => {
        store.activeReactor = name
        action = store[name]()
        return action
      })
      if (action) {
        // store it
        store.nextReaction = action
        // let browser chill
        requestIdleCallback(() => {
          const { nextReaction } = store
          store.activeReactor = null
          store.nextReaction = null
          if (nextReaction.actionCreator) {
            if (nextReaction.arg) {
              store[nextReaction.actionCreator](nextReaction.arg)
            } else if (nextReaction.args) {
              store[nextReaction.actionCreator](...nextReaction.args)
            } else {
              store[nextReaction.actionCreator]()
            }
          } else {
            store.dispatch(nextReaction)
          }
          cancelIfDone()
        })
      }
    }

    const callback = () => {
      dispatchNext()
      idleDispatcher()
      cancelIfDone()
    }

    store.subscribe(callback)
    callback()
  }
})
