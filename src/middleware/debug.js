let debug
try { debug = window.localStorage.debug } catch (e) {}

export default store => next => action => {
  if (debug) {
    console.group(action.type)
    console.info('action:', action)
  }

  const result = next(action)

  if (debug) {
    console.debug('state:', store.getState())
    window.listSelectors && window.listSelectors()
    window.listActiveEffects && window.listActiveEffects()
    console.groupEnd(action.type)
  }

  return result
}
