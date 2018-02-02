export default extraArgCreators => store => {
  const extraArgs = extraArgCreators.reduce(
    (result, fn) => Object.assign(result, fn(store)),
    {}
  )
  return next => action => {
    if (typeof action === 'function') {
      const { getState, dispatch } = store
      return action(Object.assign({}, { getState, dispatch, store }, extraArgs))
    }
    return next(action)
  }
}
