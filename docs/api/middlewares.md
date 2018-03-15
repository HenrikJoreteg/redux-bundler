# Included middleware

Redux-bundler includes a few middlewares by default:

## Slightly modified `thunk`

Works like `redux-thunk` except that everything is passed as a single argument and since all our selectors and action creators are attached to the store instance we also pass the store itself, plus anything bundles may have added by using `getExtraArgs`. So it ends up passing something like this as an argument `{dispatch, store, getState, ...extraArgs}` to your thunk function.

This lets you write action creators that don't care about argument position:

```js
export const doCoolStuff = () => ({ dispatch, myApiWrapper }) => {
  dispatch({ type: 'USER_FETCH_STARTED' })
  return myApiWrapper('/some-resource')
    .then(payload => {
      dispatch({ type: 'USER_FETCH_FINISHED', payload })
    })
    .catch(() => {
      dispatch({ type: 'USER_FETCH_FAILED' })
    })
}
```

## Debug middleware

If you're using the `debugBundle` it will also add some logging middleware that logs actions and state with each action and shows you the next reactor that will be dispatched.

## Named action middleware

The bundle created by `createReactorBundle` will also inject middleware that allows you to dispatch an object that names the action creator to be used and optionally the arguments to pass to it.

For example dispatching `{actionCreator: 'doLogOut', args: [true]}` would be the same as calling `store.doLogOut(true)`.

This is most useful when writing reactor functions in a bundle where you may not have a direct reference to the action creator function you want to call.
