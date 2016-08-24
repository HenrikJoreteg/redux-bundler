function createThunkMiddleware (extra) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(Object.assign({dispatch, getState}, extra))
    }
    return next(action)
  }
}

const thunk = createThunkMiddleware()
thunk.withExtraArgs = createThunkMiddleware

module.exports = thunk
