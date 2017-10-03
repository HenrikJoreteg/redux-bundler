import { IS_BROWSER, debounce, ric, raf } from '../utils'
import { getActionArgs } from '../middleware/custom-thunk'

const defaults = {
  idleTimeout: 30000,
  idleAction: 'APP_IDLE',
  doneCallback: null,
  stopWhenTabInactive: true
}

export const getIdleDispatcher = (stopWhenInactive, timeout, fn) => debounce(() => {
  // the requestAnimationFrame ensures it doesn't run when tab isn't active
  stopWhenInactive ? raf(() => ric(fn)) : ric(fn)
}, timeout)

export default (opts) => ({
  name: 'reactors',
  init: store => {
    opts || (opts = {})
    Object.assign(opts, defaults)
    const { idleAction, idleTimeout } = opts
    let idleDispatcher
    if (idleTimeout) {
      idleDispatcher = getIdleDispatcher(opts.stopWhenTabInactive, idleTimeout, () => store.dispatch({type: idleAction}))
    }

    if (process.env.NODE_ENV !== 'production') {
      store.meta.reactorNames.forEach(name => {
        if (!store[name]) {
          throw Error(`Reactor '${name}' not found on the store. Make sure you're defining as selector by that name.`)
        }
      })
    }

    const cancelIfDone = () => {
      if (!IS_BROWSER && !store.isReacting && (!store.selectAsyncActive || !store.selectAsyncActive())) {
        idleDispatcher && idleDispatcher.cancel()
        opts.doneCallback && opts.doneCallback()
      }
    }

    const getHasReactions = () => store.meta.reactorNames.some(name => store[name]())
    const getActiveReactions = () => store.meta.reactorNames.map(name => store[name]()).filter(Boolean)

    const dispatchNext = () => {
      const hasReactions = getHasReactions()
      if (hasReactions) {
        store.isReacting = true
        ric(() => {
          const reactions = getActiveReactions()
          // if another action snuck in here due to requestIdleCallback delay
          // re-run the active selector test
          if (reactions.length) {
            const cleaned = reactions.map(action => {
              if (typeof action === 'function') {
                return action(getActionArgs(store))
              }
              const { actionCreator } = action
              if (!actionCreator) return action
              const { args } = action
              if (args) {
                return store.meta.unboundActionCreators[actionCreator](...args)
              }
              return store.meta.unboundActionCreators[actionCreator]()
            })
            store.isReacting = false
            store.dispatch(...cleaned)
          }
          store.isReacting = false
        })
      }
    }

    const callback = () => {
      dispatchNext()
      if (idleDispatcher) {
        idleDispatcher()
        cancelIfDone()
      }
    }

    store.subscribe(callback)
    callback()
  }
})
