export default store => next => action => {
  const { actionCreator, args } = action
  if (actionCreator) {
    const found = store.meta.unboundActionCreators[actionCreator]
    if (!found) {
      throw Error(`NoSuchActionCreator: ${actionCreator}`)
    }
    return next(args ? found(...args) : found())
  }
  return next(action)
}
