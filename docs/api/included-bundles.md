# Included bundles

We take a "batteries included" approach where you don't have to use any of this stuff but where a pretty complete set of tools required for apps is included out of the box.

## `debugBundle`

This is meant to be leave-in-able in production. It works as follows:

Unless `localStorage.debug` is set to something "truthy" it will do nothing.

If enabled:

* The store is bound to `window.store` for easy access to _all selectors and action creators_ since they're all bound to the store. This is super helpful for debugging state issues, or running action creators even if you don't have UI built for it yet.
* On boot, it logs out list of all installed bundles
* On each action it logs out:
  * action object that was dispatched
  * the current state in its entirety
  * the result of all selectors after that state change
  * if there's a reactor that will be triggered as as result, it will log that out too as `next reaction`

![logger screenshot](https://cldup.com/bHBHBqkW0B-3000x3000.png)

In order to support use inside a Web Worker which doesn't have `localStorage` access debug state is stored in a reducer and it includes `doEnableDebug()` and `doDisableDebug()` action creators. But most people won't need this. Simply use the localStorage flag.

## `createUrlBundle([optionsObject])`

A complete redux-based URL solution. It binds the browser URL to Redux store state and provides a very complete
set of selectors and action creators to give you full control of browser URLs.

**Handling in-app navigation**: An extremely lightweight in-app navigation approach is to just by rendering normal `<a>` tags, add an `onClick()` handler on your root component and use [internal-nav-helper](https://github.com/HenrikJoreteg/internal-nav-helper) to inspect the events, calling `doUpdateUrl` as necessary. When click events bubble up, it will inspect the event target looking for `<a>` tags and then determining whether or not to consider it an internal link based on its href. See [internal-nav-helper](https://github.com/HenrikJoreteg/internal-nav-helper) library for more details.

Sample root component:

```js
import navHelper from 'internal-nav-helper'
import { connect } from 'redux-bundler-preact'
import { h } from 'preact'

export default connect(
  'doUpdateUrl',
  'selectRoute',
  ({ doUpdateUrl, route }) => {
    const CurrentPage = route
    return (
      <div onClick={navHelper(doUpdateUrl)}>
        <CurrentPage />
      </div>
    )
  }
)
```

Options object:

* `inert`: Boolean whether or not to bind to the browser. If you make it `inert` it will simply maintain state in Redux without trying to update the browser, or listen for `popstate`
* `handleScrollRestoration`: Boolean (default `true`). Whether or not to handle scroll position restoration on document.body. Some browsers handle this for you with the notable exception of FF and IE 11. If you leave this as `true` it should work in latest version of all browsers.

Action creators:

* `doUpdateUrl(pathname | {pathname,query,hash}, [options])`: Generic URL updating action creator. You can pass it any pathname string or an object with `pathname`, `query`, and `hash` keys. ex: `doUpdateUrl('/new-path')`, `doUpdateUrl('/new-path?some=value#hash')`. You can pass `{replace: true}` as an option to trigger `replaceState` instead of `pushState`.
  `doReplaceUrl(pathname | {pathname,query,hash})`: just like `doUpdateUrl` but replace is prefilled to replace current URL.
* `doUpdateQuery(queryString | queryObject, [options])`: can be used to update query string in place. Either pass in new query string or an object. It does a replaceState by default but you can pass `{replace: false}` if you want to do a push.
* `doUpdateHash(string | object, [options])`: for updating hash value, does a push by default, but can do replace if passed `{replace: true}`.

Selectors:

* `selectUrlRaw()`: returns contents of reducer.
* `selectUrlObject()`: returns an object like what would come from `new URL()` but as a plain object.
* `selectQueryObject()`: returns query string as an object
* `selectQueryString()`: returns query string as a string
* `selectPathname()`: returns pathname, without hash or query
* `selectHash()`: returns hash value as string
* `selectHashObject()`: returns hash value as object (if relevant)
* `selectHostname()`: returns hostname as string.
* `selectSubdomains()`: returns array of subdomains, if relevant.

## `createRouteBundle(routesObject, optionsObject)`

Takes an object of routes and returns a bundle with selectors to extract route parameters from the routes.

Example:

```js
export default createRouteBundle({
  '/': Home,
  '/users': UserList,
  '/users/:userId': UserDetail,
  '*': NotFound
})
```

The value like `Home`, `UserList`, etc, can be _anything_. Whatever the current route that matches, calling `selectRoute()` will _return whatever that is_. This could be a root component for that "page" in your app. Or it could be an object with a component name along with a page title or whatever else you may want to link to that route.

Then in your root component in your app you'd simply `selectRoute()` to retrieve it.

Options object:

* `routeInfoSelector`: String (default: `'selectPathname'`) used to configure the key that is used for matching the current route on. Set it to `'selectHash'` to enable hash-based routing. **Note**: Currently you need entries for both '' and '/' if you rely on hash-based routing.

```js
export default createRouteBundle({
  '': Home,
  '/': Home,
  '/users': UserList,
}, {
  routeInfoSelector: 'selectHash'
})
```

Selectors:

`selectRouteParams()`: returns an object of any route params extracted based on current route and current URL. In the example above `/users/:userId` would return `{userId: 'valueExtractedFromURL'}`.
`selectRouteMatcher()`: returns the route matcher function used. Can be useful for seeing what result a URL would return before actually setting that URL.
`selectRoute()`: returns whatever the value was in the routes object for the current matched route.
`selectRouteInfo()`: returns the key that was passed to the route matcher. By default this is the value of `selectPathname` as defined by the `createUrlBundle` above.

## `appTimeBundle`

This simply tracks an `appTime` timestamp that gets set any time an action is fired. This is useful for writing deterministic selectors and eliminates the need for setting timers throughout the app. Any selector that uses `selectAppTime` will get this time as an argument. It's ridiculously tiny at only 5 lines of code, but is a nice pattern. Just be careful to not do expensive work in reaction to this changing, as it changes _with each action_.

## `onlineBundle`

Tiny little (18 line) bundle that listens for `online` and `offline` events from the browser and reflects these in redux. Note that browsers will not detect "lie-fi" situations well. But these events will be fired for things like airplane mode. This can be used to suspend network requests when you know they're going to fail anyway.

Exports a single selector:

`selectIsOnline`: Returns current state.

## `asyncCountBundle`

This bundle takes no options, simply add it as is. It uses action naming conventions to track how many outstanding async actions are occurring.

It works like this:

If an action contains `STARTED` it increments, if it contains `FINISHED` or `FAILED` it decrements. It adds a single selector to the store called `selectAsyncActive`. This is intended to be used to display a global loading indicator in the app. You may have seen these implemented as a thin colored bar across the top of the UI.

## `createCacheBundle(cachingFunction)`

Adds support for local caching of bundle data to the app. Other bundle can declare caching when this has been added to the app.

This bundle takes a single required option: a function to use to persist data. The function has to take two arguments: the key and the value. The previously mentioned [example app](https://github.com/HenrikJoreteg/redux-bundler-example/blob/master/src/bundles/index.js) shows how to do this using [money-clip](https://github.com/HenrikJoreteg/money-clip).

Once the caching bundle has been added, other bundles can indicate that their contents should be persisted by exporting a `persistActions` array of action types. Any time one of those action types occur, the contents of that bundle's reducer will be persisted lazily. Again, see the example app for usage.

## `createAsyncResourceBundle(optionsObject)`

Returns a pre-configured bundle for fetching a remote resource (like some data from an API) and provides a high-level abstraction for declaring when this data should be considered stale, what conditions should cause it to fetch, and when it should expire, etc.

This bundle requires `appTimeBundle` and `onlineBundle` to be added as well (order doesn't matter) as long as both are included.

Options:

* `name` (required): name of reducer. Also used in action creator names and selector names. For example if the name is `users` you'll end up with a selector named: `selectUsers()`.
* `getPromise` (required): A function that should return a Promise that gets the data. If this throws, it will automatically be retried. If you want to consider it a permanent error that should not be retried throw an error object with a `error.permanent = true` property. **note:** this function will be called with the same arguments as you get when writing a thunk action creator: `({dispatch, getState, store, ...extraArgs }) => {}`
* `actionBaseType` (optional): This is used to build action types. So if you pass `USERS`, it will use action types like `USERS_FETCH_STARTED` and `USERS_EXPIRED`. Default: `name.toUpperCase()`.
* `staleAfter` (optional): Length of time in milliseconds after which the data should be considered stale and needing to be re-fetched. Default: 15 minutes.
* `retryAfter` (optional): Length of time in milliseconds after which a failed fetch should be re-tried after the last failure. Default: 1 minute.
* `expireAfter` (optional): Length of time in milliseconds after which data should be automatically purged because it is expired. Default: `Infinity`.
* `checkIfOnline` (optional): Whether or not to stop fetching if we know we're offline. This is imperfect because it's listens for the global `offline` and `online` events from the browser which are good for things like airplane mode, but not for "lie-fi" situations. Default: `true`
* `persist` (optional): Whether or not to include the `persistActions` required to cache this reducers content. Simply setting this to `true` doesn't mean it will be cached. You still have to make sure caching is setup using `createCachingBundle()` and a persistance mechanism [like money-clip](https://github.com/HenrikJoreteg/money-clip). Default `true`

Action creators:

Names are built dynamically using the `name` of the bundle with first letter upper-cased:

* `doFetch{Name}`: what is used internally to trigger fetches, but you can trigger it manually too.
* `doMark{Name}AsOutdated`: used to forcibly mark contents as stale, which will not clear anything, but will cause it to be re-fetched as if it's too old.
* `doClear{Name}`: clears and resets the reducer to initial state.
* `doExpire{Name}`: should mostly likely not be used directly, but it used internally when items expire. This is a bit like `doClear{Name}` except it does not clear errors and explicitly denotes that the contents are expired. So, if an app is offline and the content was wiped because it expired, your UI can show a relevant message.

Selectors:

* `select{Name}Raw`: get entire contents of reducer.
* `select{Name}`: get `data` portion of reducer (or `null`).
* `select{Name}IsStale`: Boolean. Is data stale?
* `select{Name}IsExpired`: Boolean. Is it expired?
* `select{Name}LastError`: Timestamp in milliseconds of last error or `null`
* `select{Name}IsWaitingToRetry`: Boolean. If there was an error and it's in the period where it's waiting to retry.
* `select{Name}IsLoading`: Boolean. Is it currently trying to fetch.
* `select{Name}FailedPermanently`: Boolean. Was a `error.permanent = true` error thrown? (if so, it will stop trying to fetch).
* `select{Name}ShouldUpdate`: Boolean. Based on last successful fetch, errors, loading state, should the content be updated?

Defining the state that should trigger the fetch:

Rather than manually calling `doFetch{Name}` from a component, you can use a reactor to define the scenarios in which the action should be dispatched. The simplest way is to add it to your bundle after generating it and then using the `select{Name}ShouldUpdate` as an input selector. The following code would cause the fetch to happen right away and the data to be kept up to date not matter what state the rest of the app was in or URL/Route was being displayed.

```js
const bundle = createAsyncResourceBundle({
  name: 'honeyBadger',
  actionBaseType: 'HONEY_BADGER',
  getPromise: () => {
    // return
  }
})

bundle.reactHoneyBadgerFetch = createSelector(
  'selectHoneyBadgerShouldUpdate',
  shouldUpdate => {
    if (shouldUpdate) {
      return { actionCreator: 'doFetchHoneyBadger' }
    }
  }
)

export default bundle
```

If instead you wanted to only have the fetch occur on a certain URL or route, or based on other conditions, you can check for that as well by adding and checking for other conditions in your reactor:

```js
const bundle = createAsyncResourceBundle({
  name: 'honeyBadger',
  actionBaseType: 'HONEY_BADGER',
  getPromise: () => {
    // return
  }
})

bundle.reactHoneyBadgerFetch = createSelector(
  'selectHoneyBadgerShouldUpdate',
  'selectPathname',
  (shouldUpdate, pathname) => {
    if (shouldUpdate && pathname === '/honey-badger') {
      return { actionCreator: 'doFetchHoneyBadger' }
    }
  }
)

export default bundle
```
