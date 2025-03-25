# Methods added to store

First, all `selectX` and `doX` action creators from the bundles of course.

Most of these exist in order to simplify writing code that binds state to a view library. These are used heavily by tools like:

- [redux-bundler-preact](https://github.com/HenrikJoreteg/redux-bundler-preact)
- [redux-bundler-react](https://github.com/HenrikJoreteg/redux-bundler-react)
- [redux-bundler-worker](https://github.com/HenrikJoreteg/redux-bundler-worker)

## `store.select(arrayOfSelectorNames)`

Get the results of many selectors at once. Pass it an array of selector names and it will run all those selectors and return an object of results where they key name is the name implied by the selector.

Example:

```js
// calling this:
store.select(['selectUserName', 'selectIsLoggedIn'])

// returns
{
  userName: 'some name',
  isLoggedIn: true
}
```

## `store.selectAll()`

Shortcut for calling `store.select()` but passing in all known selector names.

## `store.integrateBundles(...bundlesToAdd)`

Add additional bundles after the fact. This will manage updating redux-bundler and internally using redux's `.replaceReducer` to update the store in place.

Any `init` methods on the bundles will be called after the store is configured.

## `store.subscribeToSelectors(arrayOfSelectors, callback, [options])`

Given an array of selector names, the callback will be called whenever the resulting values change. This will _not_ be called with the initial value/state of the selector.

Passing `{ allowMissing: true }` as `options` will let you pass selectors that don't yet exist on the store without throwing an error. This may be helpful if
a bundle that gets integrated later via `integrateBundle` will add a selector that you want to listen for. If the initial value of the selector when the new bundle is integrated is anything but `undefined` the callback will be fired with the initial value.

Just like Redux's `subscribe()` it returns a function that can be used to unsubscribe.

In redux apps built without redux-bundler this type of comparison is done by `react-redux` for each connected component. By consolidating this logic onto the store itself, the binding implementations for various UI technologies can be much simpler see [redux-bundler-preact source](https://github.com/HenrikJoreteg/redux-bundler-preact/blob/master/src/index.js) as an example. Also, by consolidating this logic there's very little wasted cycles.

## `store.subscribeToAllChanges(callback)`

Shortcut for `subscribeToSelectors` where you instead subscribe to _all_. This is useful for things like [redux-bundler-worker](https://github.com/HenrikJoreteg/redux-bundler-worker) where we want to propagate state deltas to the main thread.

Returns a function that when called unsubscribes the callback.

## `store.action(actionCreatorName, [argsArray])`

Lets you dispatch an action creator by name. Give it the name of the action creator as a string, if you want to call the action creator with arguments pass the array of arguments to apply to the action creator as an array.

This utility exists to simplify support for propagating actions from main thread to web worker or vice versa.

## `store.destroy()`

Lets you remove event listeners, cleanup state and unsubscribe from store listeners. This calls the destroy implementation for every bundle. It is a 1-way function and the store cannot be re-initialized afterwards. You probably won't need this, but it can be handy if you're building a micro-frontends or portal system and you're loading/unloading whole apps in the same webpage.

## Special `BATCH_ACTIONS` action type

If you dispatch an action that looks like this `{type: 'BATCH_ACTIONS', actions: [array of other actions]}` it will dispatch them all in one update cycle. Rather than calling all callbacks at once, it will process all actions through all reducers then call the functions. These should be prepared "simple" action objects, not async actions that return a thunk function.

## Special `REPLACE_STATE` action type

If you dispatch an action like: `{type: 'REPLACE_STATE, payload: newState}` it will be as if your store got `newState` as initial state when the store was first created.

This lets you replace the entire state of your redux store. This can be handy for building tooling. Say, for example, you're building a remote PDF rendering service built with puppeteer. You could use `REPLACE_STATE` to post state from your app to the rendering service and use puppeteer to run your app, but inject the state you passed to it to produce a PDF with your app state.
