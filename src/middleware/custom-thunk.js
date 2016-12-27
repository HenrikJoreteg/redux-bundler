function createThunkMiddleware (extra) {
  return ({ dispatch, getState, store }) => next => action => {
    if (typeof action === 'function') {
      return action(Object.assign({}, store, extra))
    }
    return next(action)
  }
}

const thunk = createThunkMiddleware()
thunk.withExtraArgs = createThunkMiddleware

export default thunk
