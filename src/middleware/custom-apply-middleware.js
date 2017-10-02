import { compose } from 'redux'

export default function applyMiddleware (...middlewares) {
  return (createStore) => (reducer, preloadedState, enhancer) => {
    const store = createStore(reducer, preloadedState, enhancer)
    let dispatch = store.dispatch
    let chain = []
    chain = middlewares.map(middleware => middleware(store))
    dispatch = compose(...chain)(store.dispatch)
    return Object.assign(store, { dispatch })
  }
}
