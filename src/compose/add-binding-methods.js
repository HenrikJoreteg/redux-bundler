import { selectorNameToValueName } from '../utils'

export default store => {
  store.subscriptions = {
    watchedValues: {}
  }
  const subscriptions = (store.subscriptions.set = new Set())
  const watchedSelectors = (store.subscriptions.watchedSelectors = {})

  const watch = selectorName => {
    watchedSelectors[selectorName] = (watchedSelectors[selectorName] || 0) + 1
  }
  const unwatch = selectorName => {
    const count = watchedSelectors[selectorName] - 1
    if (count === 0) {
      delete watchedSelectors[selectorName]
    } else {
      watchedSelectors[selectorName] = count
    }
  }

  // add single store subscription for tracking watched changes
  store.subscribe(() => {
    const newValues = watchedSelectors.all
      ? store.selectAll()
      : // allowMissing is always true here because we don't need to worry about
        // the selector being missing on every single change, we can just ignore the
        // missing selectors. Instead, the check for missing selectors (if we care)
        // is done in the subscribeToSelectors method when we setup the subscription initially
        store.select(Object.keys(watchedSelectors), { allowMissing: true })
    const { watchedValues } = store.subscriptions

    // the only diffing in the app happens here
    const changed = {}
    for (const key in newValues) {
      const val = newValues[key]
      if (val !== watchedValues[key]) {
        changed[key] = val
      }
    }

    store.subscriptions.watchedValues = newValues

    // look through subscriptions to trigger
    subscriptions.forEach(subscription => {
      const relevantChanges = {}
      let hasChanged = false
      if (subscription.names === 'all') {
        Object.assign(relevantChanges, changed)
        hasChanged = !!Object.keys(relevantChanges).length
      } else {
        subscription.names.forEach(name => {
          if (Object.prototype.hasOwnProperty.call(changed, name)) {
            relevantChanges[name] = changed[name]
            hasChanged = true
          }
        })
      }
      if (hasChanged) {
        subscription.fn(relevantChanges)
      }
    })
  })

  // this exists separately in order to support
  // subscribing to all changes even after lazy-loading
  // additional bundles
  store.subscribeToAllChanges = callback =>
    store.subscribeToSelectors('all', callback)

  // given an array of selector names, it will call the
  // callback any time those have changed with an object
  // containing only changed values
  store.subscribeToSelectors = (keys, callback, options) => {
    // If the selectors don't exist yet they will simply be ignored
    // this allows a later integratedBundle to add the selector
    const allowMissing = (options && options.allowMissing) || false

    const isAll = keys === 'all'
    // re-use loop for double duty
    // extract names, but also ensure
    // selector actually exists on store
    const subscription = {
      fn: callback,
      names: isAll ? 'all' : keys.map(selectorNameToValueName)
    }
    subscriptions.add(subscription)
    isAll ? watch('all') : keys.forEach(watch)

    // make sure starting values are in watched so we can
    // track changes
    Object.assign(
      store.subscriptions.watchedValues,
      isAll ? store.selectAll() : store.select(keys, { allowMissing })
    )

    // return function that can be used to unsubscribe
    return () => {
      subscriptions.delete(subscription)
      isAll ? unwatch('all') : keys.forEach(unwatch)
    }
  }
}
