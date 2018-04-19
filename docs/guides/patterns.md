# Recommended patterns

1.  _all_ redux-related functionality should live in a bundle.
2.  Just keep a single, flat folder called `bundles` with one bundle per file.
3.  Make an `index.js` file in `bundles` to export the result of `composeBundles()`, the resulting function takes a single argument which is any locally cached or bootstrapped data you may have, and returns a redux store. This is also useful for passing settings or config values to bundles that are dynamic as you see with the `cachingBundle` and `googleAnalytics` below:
    > ```js
    > import { composeBundles, createCacheBundle } from 'redux-bundler'
    > import config from '../config'
    > import user from '/user'
    > import other from './other'
    > import googleAnalytics from './analytics'
    > import { getConfiguredCache } from 'money-clip'
    >
    > const cache = getConfiguredCache({
    >   version: config.browserCacheVersion
    > })
    >
    > export default composeBundles(
    >   user,
    >   createCacheBundle(cache.set),
    >   other,
    >   googleAnalytics(config.gaId, '/admin')
    > )
    > ```
4.  Data is _always_ read from the store via selectors
5.  Selectors must be written to take _the entire_ state as an argument
6.  Selectors must be named starting with the word `select` such as `selectAppTime`.
7.  Actions creators must be named starting with the word `do` such as `doLogin`.

## Caching

Persisting data locally can have a huge impact on performance. But comes with many caveats with regard to loading stale data, loading data from another user, and handling changes in "shape" of data that's been cached.

Using [money-clip](https://github.com/HenrikJoreteg/money-clip) with `createCacheBundle` can help address all of these issues. See money-clip readme for more.

This approach is implemented in the [example app](https://github.com/HenrikJoreteg/redux-bundler-example).

## Routing

Use `createRouteBundle()` to generate routes as seen in the example app. When determining what to actually store as the "value" for a given route, I tend to use a component but you could certainly also return a string to be used for `<title></title>` or any other relevant items.

## React-Native (RN)

If you are using `redux-bundler` with RN make sure you run `global.self = global` as the very first piece of code. The most common approach would be to put the code snippet in a seperate file and import it as the first one in your RN entry point/s.  

Some bundles like the `debugBundle` arent compatible with RN. So we cant use `composeBundles()` and only the `composeBundlesRaw()`
method can help us out. 
If you want to use the reactions feature dont forget to compose `createReactionBundle()` in the compose function otherwise your 
actions returned never got dispatched!

```
import { composeBundlesRaw, createReactorBundle } from 'redux-bundler'

export default composeBundlesRaw(
    createReactorBundle(),
    // ... add more bundles here
)
```

## Using Redux DevTools

Both the `debug` bundle and redux dev tools are enabled if `localStorage.debug` is set to something "truthy". In this way you can keep your production apps debuggable, you just have to flip that `localStorage.debug` flag to enable it. Also beware that running `localStorage.debug = false` in your browser console won't actually turn it off. This is because LocalStorage serializes everything to strings so the value that's stored is actually the string `"false"` which... is truthy! So to turn it back off again, you can just do: `delete localStorage.debug` instead.
