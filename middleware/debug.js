let debug
try { debug = window.localStorage.debug } catch (e) {}

module.exports = store => next => action => {
  if (debug) {
    console.group(action.type)
    console.info('action:', action)
  }

  const result = next(action)

  if (debug) {
    console.debug('state:', store.getState())
    window.listActiveEffects && window.listActiveEffects()
    console.groupEnd(action.type)
  }

  return result
}
