export default store => next => action => {
  if (typeof action === 'function') {
    return action(getActionArgs(store))
  }
  return next(action)
}

export const getActionArgs = store => {
  const { getState, dispatch } = store
  return Object.assign({}, {getState, dispatch, store}, store.meta.extraArgs)
}
