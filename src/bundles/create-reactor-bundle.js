import { IS_BROWSER, debounce, ric, raf } from '../utils'

const defaults = {
  idleTimeout: 30000,
  idleAction: 'APP_IDLE',
  doneCallback: null,
  stopWhenTabInactive: true,
  cancelIdleWhenDone: true,
  reactorPermissionCheck: null
}

const ricOptions = { timeout: 500 }
export const getIdleDispatcher = (stopWhenInactive, timeout, fn) =>
  debounce(() => {
    // the requestAnimationFrame ensures it doesn't run when tab isn't active
    stopWhenInactive ? raf(() => ric(fn, ricOptions)) : ric(fn, ricOptions)
  }, timeout)

export default spec => ({
  name: 'reactors',
  init: store => {
    const {
      idleAction,
      idleTimeout,
      cancelIdleWhenDone,
      doneCallback,
      stopWhenTabInactive,
      reactorPermissionCheck
    } = Object.assign({}, defaults, spec)
    let idleDispatcher
    if (idleTimeout) {
      idleDispatcher = getIdleDispatcher(stopWhenTabInactive, idleTimeout, () =>
        store.dispatch({ type: idleAction })
      )
    }

    store.getNextReaction = (skipPermissionCheck = false) => {
      for (let i = 0, l = store.meta.reactorNames.length; i < l; i++) {
        const name = store.meta.reactorNames[i]
        const result = store[name]()
        if (result) {
          // enable passing a fn to check whether a given reactor should be allowed
          if (
            !skipPermissionCheck &&
            reactorPermissionCheck &&
            !reactorPermissionCheck(name, result)
          ) {
            continue
          }
          return { name, result }
        }
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      store.meta.reactorNames.forEach(name => {
        if (!store[name]) {
          throw Error(
            `Reactor '${name}' not found on the store. Make sure you're defining as selector by that name.`
          )
        }
      })
    }

    const cancelIfDone = () => {
      if (
        !IS_BROWSER &&
        !store.nextReaction &&
        (!store.selectAsyncActive || !store.selectAsyncActive())
      ) {
        idleDispatcher && idleDispatcher.cancel()
        doneCallback && doneCallback()
      }
    }

    const dispatchNextReaction = () => {
      // make sure it's still relevant and store it
      // this time don't verify permission, we already
      // did once.
      store.nextReaction = store.getNextReaction(true)
      if (store.nextReaction) {
        const { nextReaction } = store
        store.nextReaction = null
        store.dispatch(nextReaction.result)
      }
    }

    const dispatchNext = () => {
      // one at a time
      if (store.nextReaction) {
        return
      }
      // store next reaction for reference
      store.nextReaction = store.getNextReaction()
      if (store.nextReaction) {
        ric(dispatchNextReaction, ricOptions)
      }
    }

    const callback = () => {
      dispatchNext()
      if (idleDispatcher) {
        idleDispatcher()
        cancelIdleWhenDone && cancelIfDone()
      }
    }

    const unsubscribe = store.subscribe(callback)
    callback()

    return () => {
      idleDispatcher && idleDispatcher.cancel()
      unsubscribe()
    }
  }
})
