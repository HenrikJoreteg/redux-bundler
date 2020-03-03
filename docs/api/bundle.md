# Bundle API

Things bundles can contain:

## `bundle.name`

The only required attribute your bundle should supply. This will be used as the name of any exported reducer.

## `bundle.reducer` or `bundle.getReducer()`

If you export an item called `reducer` it is assumed it's a ready-to-user redux reducer. Sometimes you need to dynamically configure something like `initialData` in these cases a bundle can supply a `getReducer` function instead that will return a reducer. This can be useful for any setup you may need to do, like defining initialState, or whatnot.

## `bundle.selectX`

Anything you attach that starts with `select` such as `selectUserData` will be assumed to be a selector function that takes the entire state object selects what you want out of it. This supports any function that takes the entire store state and returns the relevant data. If you use the `createSelector` method exported by this library, you can create selectors whose dependencies are string names of other selectors. This allows for loose coupling between modules and means that you never have to worry about creating circular imports when various selectors depend on each other. This is possible because as part of creating the store, the library will resolve all those names into real functions. This is powered by [create-selector](https://github.com/HenrikJoreteg/create-selector) :point_left: which is basically a fork of reselect.

## `bundle.doX`

Similarly to selectors, if your bundle contains any keys that start with `do`, such as `doSomething` they'll be assumed to be action creators.

These will be bound to dispatch for you and attached to the store. So you can call `store.doSomething('cool')` directly.

**important**: a slightly modified thunk middleware is included by default. So you always have access to `dispatch`, `getState`, and `store` within action creators as follows.

```js
const doSomething = value => ({ dispatch }) =>
  dispatch({ type: 'something', payload: value })
```

Note that unlike standard thunk that uses positional arguments, this passes just one object containing `dispatch`, `getState`, and any other items included by bundles that define `getExtraArgs`.

## `bundle.reactX`

Reactors are like selectors but start with the word `react`. They get run automatically by redux-bundler whatever they return gets dispatched. This could either be an object: `{type: 'INITIATE_LOGIN'}` or it could be a named action creator like: `{actionCreator: 'doInitiateLogin', args: ['username']}`.

This allows a simple, declarative way to ask questions of state, via selectors to trigger an effect via action reators without the need to introduce new approaches to deal with effects.

**important**: It is _easy to make infinite loops_. Make sure that any action triggered by a reactor, immediately change the conditions that caused your reactor function to return something.

## `bundle.getExtraArgs`

If you define this function it should return an object containing items you wish to make available to all action creators of all bundles.

Commonly this would be used for passing things like api wrappers, configs, etc.

**important**: this function will be called _with the store_. This allows you to do things like create API wrappers that automatically handle authorization failures to trigger redirects, etc.

## `bundle.init`

This will be run _once_ as a last step before the store is returned. It will be passed the `store` as an argument. This is useful for things like registering event listeners on the window or any other sort of initialization activity.

For example, you may want redux to track current viewport width so that other selectors can change behavior based on viewport size. You could create a `viewport` bundle and register a debounced event listener for the `resize` event on window, and then dispatch a `WINDOW_RESIZED` action with the new width/height and add a `selectIsMobileViewport` selector to make it available to other bundles.

You probably won't need this, but if you return a function from init, that function will be called if you call `store.destroy()`. This can be useful if you're building a micro-frontends or portal system and need to load/unload whole apps in the same webpage.

```js
  ...
  init: (store) {
    const handleOnline = () => store.dispatch({ type: 'ONLINE' })

    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }
  ...
```

## `bundle.persistActions`

If the caching bundle is configured it will look for this property from other bundles. It should contain an array of action types that should cause contents of this bundle's reducer to be persisted to cache. These action types will be used by some generated redux middleware to lazily persist the contents of the reducer any time these actions occur.

Please note this is completely inert if no caching is configured for the app.
