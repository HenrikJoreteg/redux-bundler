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
