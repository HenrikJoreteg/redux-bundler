export default store => next => action => {
  if (typeof action === 'function') {
    const { getState, dispatch } = store
    return action(Object.assign({}, {getState, dispatch, store}, store.meta.extraArgs))
  }
  return next(action)
}
