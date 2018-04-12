// Modified to expose all of `store` to middleware instead of just
// `getState` and `dispatch`
import { compose } from 'redux'

export default (...middlewares) => createStore => (
  reducer,
  preloadedState,
  enhancer
) => {
  const store = createStore(reducer, preloadedState, enhancer)
  const chain = middlewares.map(middleware => middleware(store))
  store.dispatch = compose(...chain)(store.dispatch)
  return store
}
