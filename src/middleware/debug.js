export default store => next => action => {
  const isDebug = store.getState().debug

  if (isDebug) {
    console.group(action.type)
    console.info('action:', action)
  }

  const result = next(action)

  if (isDebug) {
    console.debug('state:', store.getState())
    store.doLogEverything && store.doLogEverything()
    console.groupEnd(action.type)
  }

  return result
}
