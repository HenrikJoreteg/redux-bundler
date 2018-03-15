# redux-bundler

A Redux framework for composing a store out of smaller bundles of functionality.

1.  Dramatically reduces boilerplate without changing or replacing basic Redux concepts.
1.  Not a toy project. This is how I build production Redux apps.
1.  One npm install includes a lot of functionality and still only weighs [9kb total](https://bundlephobia.com/result?p=redux-bundler).
1.  Designed with PWAs in mind. Pair with [preact](https://preactjs.com/) and [money-clip](https://github.com/HenrikJoreteg/money-clip) for a complete app toolkit in ~14kb (before tree-shaking).
1.  "Batteries included" approach where you use what you want, and tree-shake out the rest.
1.  Simplified and more efficient `connect()` for binding to components (available for [React](https://github.com/HenrikJoreteg/redux-bundler-react) and [Preact](https://github.com/HenrikJoreteg/redux-bundler-preact))
1.  Includes a very lightweight, robust, routing system (optional).
1.  Supports code-splitting/lazy-loading of Redux bundles.
1.  Makes re-use of Redux related code between apps really simple; just publish a bundle to npm.
1.  Can run entirely in a WebWorker using [redux-bundler-worker](https://github.com/HenrikJoreteg/redux-bundler-worker) (complete [example app here](https://github.com/HenrikJoreteg/redux-bundler-worker-example)).
1.  Supports the "reactor" pattern letting your react to your application state to dispatch other actions. This lets you write a total "honey badger" of an app that can seamlessly recover from errors and tolerate terrible network conditions.
1.  Full [example-app](https://github.com/HenrikJoreteg/redux-bundler-example) available demonstrating data fetching, clientside caching, routing, etc.

## Motivation

It's no secret that there's a lot of boilerplate when building Redux applications. There are some [tips for reducing it in the official documentation](https://redux.js.org/recipes/ReducingBoilerplate.html) and there's an [open issue with over 100 comments](https://github.com/reactjs/redux/issues/2295) on the redux repo about how to handle it that is left largely unresolved.

I've been building redux apps for quite some time and some of you may have been introduced to it when I first [blogged about it](https://blog.andyet.com/2015/08/06/what-the-flux-lets-redux/) back in 2015. This library is how I build redux apps, I finally decided to open source it.

It lets you compose a larger redux app out what I call "redux bundles" that encapsulate related functionality. Usually, a bundle includes a reducer, some action creators, and some selectors.

This isn't a toy project. I'm currently using this library in the three different production apps that power my online donation platform, [Speedy](https://speedy.gift). This also builds on some of the ideas that were originally conceived and battle-tested when I was helping Starbucks re-platform and build their [shiny new PWA](https://app.starbucks.com). The point is this is actually how I build things with Redux, and given the lack of "solutions" to the boilerplate issue, I decided to share it.

There's a ton more that needs to be documented, but the sample application [the source is here](https://github.com/HenrikJoreteg/redux-bundler-example) is a good way to see how to build something with it. It's [deployed here](https://redux-bundler.netlify.com/) so you can see how it all works when it's up and running.

Note: redux-bundler includes its dependencies for simplicity to minimize surface are for bugs due to version mismatches. It also exports all the exports from redux. So you can still do stuff like `import { combineReducers } from 'redux-bundler'`. However, this also means you end up with code from redux with the debug blocks `if (process.env.NODE_ENV !== "production")` still present. Build your app with NODE_ENV="production" before minification to strip that out for production. You can use DefinePlugin for webpack (http://stackoverflow.com/questions/30030031), loose-envify (https://github.com/zertosh/loose-envify) for browserify, or rollup-plugin-replace for Rollup (https://github.com/rollup/rollup-plugin-replace) to do this.

## A quick example

Suppose you want to track some state related to the current user in your app.

Historically redux developers would spread this out across several files maybe add some action constants to one file, a reducer, somewhere else, perhaps a set of selectors in another file, and action creators in yet another.

With redux-bundler you create a single file perhaps in "/bundles/user.js" that looks something like this:

```js
import { createSelector } from 'redux-bundler'

export default {
  name: 'user',
  getReducer: () => {
    const initialState = { loggedIn: false, name: null }

    return (state = initialState, { type, payload }) => {
      if (type === 'USER_LOGGED_IN') {
        return Object.assign({}, state, { loggedIn: true, name: payload })
      }
      return state
    }
  },
  selectUserState: state => state.user,
  selectIsLoggedIn: createSelector(
    'selectUserState',
    userState => userState.loggedIn
  ),
  doLogin: name => ({ type: 'USER_LOGGED_IN', payload: name })
}
```

In this way you group related reducers, selectors, action creators. Redux-bundler then takes bundles like this and combines them all into a store and pre-binds and attaches everything to the _redux store itself_.

For example, simply by naming a function on the exported object `selectIsLoggedIn` redux-bundler when given this bundle will add a method to the store itself that can be called without arguments like this: `store.selectIsLoggedIn()` that returns the result of that selector given the current redux state.

Similarly, action creators start with `do` and get pre-bound and attached to the store so all you have to do is call `store.doLogin()` to dispatch the action creator on the store.

The thing is, rather than importing selectors, constants, and binding action creators all over the place you can now just `connect()` to inject it as a property _just by using its name as a string_ like this:

```js
import { connect } from 'redux-bundler-preact'

const MyComponent = ({isLoggedIn, doLogin}) => (
  <div>
    {isLoggedIn && (
      <p>You are logged in!</p>
    )}
    {!isLoggedIn && (
      <button onClick={() => doLogin('John Doe')}>Click to log in!</button>
    )}
  </div>
)

export const connect(
  'doLogin',
  'selectIsLoggedIn',
  MyComponent
)
```

Things to note about the example:

* `selectIsLoggedIn` selects and passes a prop named `isLoggedIn` (not `SelectIsLoggedIn` because that'd be weird).
* `doLogin` doesn't need to be bound to the store in any way, because it was already pre-bound when it was attached to the store so the function passed as a prop is already ready to use and it will just do what you'd expect.
* if for some reason you make a typo in one of these names of a selector or action creator the mistake will be easy to catch because `connect()` will throw an error if you try to connect something that doesn't exist on the store.
* There's a single import, instead of three. This is a drastic reduction of boilerplate especially when you're connecting many things (not to mention wasted time resolving require dependencies).
* There's no need to write a `mapStateToProps` or `mapDispatchToProps` function to pass to `connect()`
* The `connect()` method here along with a `<Provider />` are available [for Preact](https://github.com/HenrikJoreteg/redux-bundler-preact) and [for React](https://github.com/HenrikJoreteg/redux-bundler-react).

## What this enables

This approach of consolidating everything on the store actually enables some interesting things.

* Reuse of redux-related functionality across applications. (For example, I share an "authBundle" between 3 different apps built on the same API).
* You can make configurable bundles! You can write higher-level functions that returns a pre-configured bundle. This is _huge_ for reducing boilerplate for things like simple data fetches.
* So much of your application logic can now be decoupled from components, while still keeping things tidy. Components can focus on what they do best: rendering their current props.
* It strongly enforces a set of conventions for building redux apps (this is important for larger teams, especially). For example, you have to name your selectors starting with `select`.
* The lib also supports lazy-loading additional redux bundles even after you've created the store. The new bundles are integrated into the existing redux store. Since, connected components reference things by name instead of directly import functions the the components can be sent in different JS payload than the redux code that will power them because until they're actually used they can reference things that don't yet exist on the store.
* This lib also includes an integrated approach for how to react to certain state conditions in your app. You can define special selectors that start with `react` instead of `select` that will be evaluated on a regular basis and can return actions to trigger in response. This enables really, really interesting patterns of being able to recover from failure and retrying failed requests, etc. The level of reliability that can be achieved here is _very_ powerful especially for use in PWAs that may well be offline or have really poor network conditions.
* The fact that you _have to use a selector_ to get state from redux dramatically simplifies refactoring of large redux apps.
* You can pass an array of selector names you want to subscribe to and get a callback with changes for those particular selectors. By consolidates state diffing into a single spot in the store, `connect()` doesn't have to do any dirty checking, so the binding code becomes very simple.
* Connected action creators are already pre-bound to the store so you never have to import an action creator and then bind it before using it in your component, which I've found to be really confusing for developers learning redux.
* It includes a debug bundle you can enable to see nice summary of what's happening for each action that is dispatched.
* In debug mode (which is enabled by setting `localStorage.debug` to a truthy value) the store instance is bound to `window` allowing console debugging of all your selectors, action creators via the JS console. For example you can type stuff like `store.selectIsLoggedIn()` to see results or `store.doLogout()` to trigger that action creator even if you don't have UI built for that yet.
* It is uniquely well-suited for running inside a WebWorker. Because so much of your application logic lives in the resulting store, and because it lets you subscribe to changes and get deltas of the state you care about, this whole system is uniquely well suited for being ran off of the main thread. I've actually done this extensively but ended up backing out of that approach right before shipping because i hit a few snags with some browsers. I'll try to put together an example app sometime showing this, overall it actually works really, really well.

## What about async stuff?!

This is another one of the chief complaints people have with redux. They eventually feel like `redux-thunk` doesn't suit their needs. This generally happens once they need to do something more complex than simple data fetches. Solutions like redux-loop or redux-saga attempt to solve this issue. I've never liked either one or any other solution that I've seen, for that matter. They're generally _way_ more complicated than redux-thunk and in my opinion, nearly impossible for beginners to grok.

Let's take a step back. Many developers, if using react will use component life-cycle methods like `componentDidMount` to trigger data fetches required by that component. But this sucks for many reasons:

1.  You've coupled data fetching arbitrarily to a component, what if another component needs the same data but it hasn't been fetched yet?
2.  What if the component, due to user actions gets removed and immediately added back because the user clicked "back"?
3.  What if you know ahead of time that data is _going_ to be needed by the application, even if it isn't needed yet?
4.  What if it fails and we want to retry a couple of times before we show a "failed" message to the user?
5.  What if you want to show the data you already have, while fetching updated data in the background?

The point I'm trying to make is that coupling data fetches to a component being visible, or even to a certain URL in your app isn't ideal.

What you're really trying to do is define a set of _conditions_ that should lead to a new data fetch. For example you may want to fetch if:

1.  Nothing has actually happened but 5 minutes have passed since the last successful fetch.
2.  You don't already have the data
3.  It errored last time you fetched and 15 seconds has passed, but you still have some data that you want to keep showing because it's recent enough.
4.  You've successfully fetched related data first
5.  A user is on any url that includes `/reports` in the pathname.

Good luck writing that with simple procedural code!

Part of the appeal of react, as a movement, was to move toward a more reactive style of programming. Yet, most of our data-related stuff is _very_ simplistic.

What we want, is our app to behave like a spreadsheet. I wrote about this in [a post about reactive programming](https://joreteg.com/blog/reactive-programming).

What if we let the current state of the app determine what should happen next? Instead of manually triggering things, what if a certain state could cause an action creator to fire? All of a sudden we can describe the _conditions_ under which a data fetch should occur. We don't need better async solutions for redux, thunk is fine, what we need is a way to trigger "reactions" to certain state.

redux-bundler includes a pattern for this. Bundles can include what I call "reactors", which are really just selector functions. They can have dependencies on other selectors, and get passed the entire current state, just like other selectors. But if they return something it gets dispatched. This is all managed by redux-bundler. If your bundle includes a key that starts with `react` it will be assumed to be a reactor. From a reactor you can check for whatever conditions in your app you can dream up and then return the action you want to dispatch. And, to be consistent with the decoupled philosophies, you can return an object containing the name of the action creator you want to trigger and the arguments to call it with.

As an example, I like to make a bundle that just manages all the redirects in my app. Here's an an abbreviated version from an actual app:

```js
import { createSelector } from 'redux-bundler'

const publicUrls = ['/', '/login', '/signup']

export default {
  name: 'redirects',
  reactRedirects: createSelector(
    'selectIsLoggedIn',
    'selectPathname',
    'selectHasNoOrgs',
    (isLoggedIn, pathname, hasNoOrgs, activeOrgHasBasicInfo) => {
      if (isLoggedIn && publicUrls.includes(pathname)) {
        return { actionCreator: 'doUpdateUrl', args: ['/orgs'] }
      }
      if (!isLoggedIn && pathname.startsWith('/orgs')) {
        return { actionCreator: 'doUpdateUrl', args: ['/login'] }
      }
      if (hasNoOrgs && pathname === '/orgs') {
        return { actionCreator: 'doReplaceUrl', args: ['/orgs/create'] }
      }
      // remove trailing slash
      if (pathname !== '/' && pathname.endsWith('/')) {
        return { actionCreator: 'doReplaceUrl', args: [pathname.slice(0, -1)] }
      }
    }
  )
}
```

Now I have one unified place to see anything that could cause a redirect in my app.

## Recommended patterns

1.  _all_ redux-related functionality should live in a bundle.
2.  just keep a single, flat folder called `bundles` with one bundle per file
3.  make an `index.js` file in `bundles` to export the result of `composeBundles()`, the resulting function takes a single argument which is any locally cached or bootstrapped data you may have, and returns a redux store. This is also useful for passing settings or config values to bundles that are dynamic as you see with the `cachingBundle` and `googleAnalytics` below:
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
4.  data is _always_ read from the store via selectors
5.  selectors should be written to take _the entire_ state as an argument
6.  Selectors should be named starting with the word `select` such as `selectAppTime`.
7.  Actions creators should be named starting with the word `do` such as `doLogin`.

## Included middleware

1.  A slightly modified `thunk` middleware. Main difference being that everything is passed as a single argument object and one of the arguments passed is the `store` itself. It passes `{dispatch, store, getState}` plus anything you've explicitly set as extraArgs if any of your bundles define them.
2.  Debug middleware for logging out actions and state with each action. But it also shows you things like the next "reaction" selector that will run.
3.  In order to support the "reactors" pattern where a selector causes an action. It includes a `namedActionMiddleware` that lets you dispatch something that looks like: `{actionCreator: 'doTheThing', args: ['hi']}`. And it will call the right action creator with the arguments you pass. Very likely you'll never use this directly.

## Bundle API

Things bundles can contain:

### `bundle.name`

The only required attribute your bundle should supply. This will be used as the name of any exported reducer.

### `bundle.reducer` or `bundle.getReducer()`

If you export an item called `reducer` it is assumed it's a ready-to-user redux reducer. Sometimes you need to dynamically configure something like `initialData` in these cases a bundle can supply a `getReducer` function instead that will return a reducer. This can be useful for any setup you may need to do, like defining initialState, or whatnot.

### `bundle.selectX(state)`

Anything you attach that starts with `select` such as `selectUserData` will be assumed to be a selector function that takes the entire state object selects what you want out of it. This supports any function that takes the entire store state and returns the relevant data. If you use the `createSelector` method exported by this library, you can create selectors whose dependencies are string names of other selectors. This allows for loose coupling between modules and means that you never have to worry about creating circular imports when various selectors depend on each other. This is possible because as part of creating the store, the library will resolve all those names into real functions. This is powered by [create-selector](https://github.com/HenrikJoreteg/create-selector) :point_left: which is basically a fork of reselect.

### `bundle.doX`

Similarly to selectors, if your bundle contains any keys that start with `do`, such as `doSomething` they'll be assumed to be action creators.

These will be bound to dispatch for you and attached to the store. So you can call `store.doSomething('cool')` directly.

**important**: a slightly modified thunk middleware is included by default. So you always have access to `dispatch`, `getState`, and `store` within action creators as follows.

```js
const doSomething = value => ({ dispatch }) =>
  dispatch({ type: 'something', payload: value })
```

Note that unlike standard thunk that uses positional arguments, this passes just one object containing `dispatch`, `getState`, and any other items included by bundles that define `extraArgs`.

### `bundle.reactX(state)`

Reactors are like selectors but start with the word `react`. They get run automatically by redux-bundler whatever they return gets dispatched. This could either be an object: `{type: 'INITIATE_LOGIN'}` or it could be a named action creator like: `{actionCreator: 'doInitiateLogin', args: ['username']}`.

This allows a simple, declarative way to ask questions of state, via selectors to trigger an effect via action reators without the need to introduce new approaches to deal with effects.

**important**: It is _easy to make infinite loops_. Make sure that any action triggered by a reactor, immediately change the conditions that caused your reactor function to return something.

### `bundle.getExtraArgs(store)`

If you define this function it should return an object containing items you wish to make available to all action creators of all bundles.

Commonly this would be used for passing things like api wrappers, configs, etc.

**important**: this function will be called _with the store_. This allows you to do things like create API wrappers that automatically handle authorization failures to trigger redirects, etc.

### `bundle.init(store)`

This will be run _once_ as a last step before the store is returned. It will be passed the `store` as an argument. This is useful for things like registering event listeners on the window or any other sort of initialization activity.

For example, you may want redux to track current viewport width so that other selectors can change behavior based on viewport size. You could create a `viewport` bundle and register a debounced event listener for the `resize` event on window, and then dispatch a `WINDOW_RESIZED` action with the new width/height and add a `selectIsMobileViewport` selector to make it available to other bundles.

### `bundle.persistActions: [...ActionTypes]`

If the caching bundle is configured it will look for this property from other bundles. It should contain an array of action types that should cause contents of this bundle's reducer to be persisted to cache. These action types will be used by some generated redux middleware to lazily persist the contents of the reducer any time these actions occur.

Please note this is completely inert if no caching is configured for the app.

## Top level API

### `composeBundles(...bundles)`

Returns a function that will return a fully configured store composed of all the bundles **including some built-in ones that you're likely to want**. If you have any data to use as starting state, it can be passed to this function.

Included bundles:

* `appTimeBundle`
* `asyncCountBundle`
* `onlineBundle`
* `createUrlBundle()`
* `createReactorBundle()`
* `debugBundle`

### `composeBundlesRaw(...bundles)`

Same as `composeBundles(...bundles)` but does not include anything bundles by default.

### `createSelector()`

Can be used to create selectors as described in the `selectX` section of the bundle API.

### `HAS_WINDOW`

Is `window` defined

### `IS_BROWSER`

Like `HAS_WINDOW` but also tries to determine if we're in a WebWorker.

### `raf`

Shim for `requestAnimationFrame` with fallback to `setTimeout(0)` for node.

### `ric`

Shim for `requestIdleCallback` with fallback to `setTimeout(0)` for node.

### Exports `*` from redux

As previously stated, this library includes Redux, so redux methods are exported too.

## Included bundles

We take a "batteries included" approach where you don't have to use any of this stuff but where a pretty complete set of tools required for apps is included out of the box.

### `debugBundle`

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

![logger screenshot](https://cloudup.com/ckaa_RK5H6a)

In order to support use inside a Web Worker which doesn't have `localStorage` access debug state is stored in a reducer and it includes `doEnableDebug()` and `doDisableDebug()` action creators. But most people won't need this. Simply use the localStorage flag.

### `createUrlBundle([optionsObject])`

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

### `createRouteBundle(routesObject)`

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

Selectors:

`selectRouteParams()`: returns an object of any route params extracted based on current route and current URL. In the example above `/users/:userId` would return `{userId: 'valueExtractedFromURL'}`.
`selectRoute()`: returns whatever the value was in the routes object for the current matched route.

### `appTimeBundle`

This simply tracks an `appTime` timestamp that gets set any time an action is fired. This is useful for writing deterministic selectors and eliminates the need for setting timers throughout the app. Any selector that uses `selectAppTime` will get this time as an argument. It's ridiculously tiny at only 5 lines of code, but is a nice pattern. Just be careful to not do expensive work in reaction to this changing, as it changes _with each action_.

### `onlineBundle`

Tiny little (18 line) bundle that listens for `online` and `offline` events from the browser and reflects these in redux. Note that browsers will not detect "lie-fi" situations well. But these events will be fired for things like airplane mode. This can be used to suspend network requests when you know they're going to fail anyway.

Exports a single selector:

`selectIsOnline`: Returns current state.

### `asyncCountBundle`

This bundle takes no options, simply add it as is. It uses action naming conventions to track how many outstanding async actions are occurring.

It works like this:

If an action contains `STARTED` it increments, if it contains `FINISHED` or `FAILED` it decrements. It adds a single selector to the store called `selectAsyncActive`. This is intended to be used to display a global loading indicator in the app. You may have seen these implemented as a thin colored bar across the top of the UI.

### `createCachingBundle(cachingFunction)`

Adds support for local caching of bundle data to the app. Other bundle can declare caching when this has been added to the app.

This bundle takes a single required option: a function to use to persist data. The function has to take two arguments: the key and the value. The previously mentioned [example app](https://github.com/HenrikJoreteg/redux-bundler-example/blob/master/src/bundles/index.js) shows how to do this using [money-clip](https://github.com/HenrikJoreteg/money-clip).

Once the caching bundle has been added, other bundles can indicate that their contents should be persisted by exporting a `persistActions` array of action types. Any time one of those action types occur, the contents of that bundle's reducer will be persisted lazily. Again, see the example app for usage.

### `createAsyncResourceBundle(optionsObject)`

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

* `doFetch{{Name}}`: what is used internally to trigger fetches, but you can trigger it manually too.
* `doMark{{Name}}AsOutdated`: used to forcibly mark contents as stale, which will not clear anything, but will cause it to be re-fetched as if it's too old.
* `doClear{{Name}}`: clears and resets the reducer to initial state.
* `doExpire{{Name}}`: should mostly likely not be used directly, but it used internally when items expire. This is a bit like `doClear{{Name}}` except it does not clear errors and explicitly denotes that the contents are expired. So, if an app is offline and the content was wiped because it expired, your UI can show a relevant message.

Selectors:

* `select{{Name}}Raw`: get entire contents of reducer.
* `select{{Name}}`: get `data` portion of reducer (or `null`).
* `select{{Name}}IsStale`: Boolean. Is data stale?
* `select{{Name}}IsExpired`: Boolean. Is it expired?
* `select{{Name}}LastError`: Timestamp in milliseconds of last error or `null`
* `select{{Name}}IsWaitingToRetry`: Boolean. If there was an error and it's in the period where it's waiting to retry.
* `select{{Name}}IsLoading`: Boolean. Is it currently trying to fetch.
* `select{{Name}}FailedPermanently`: Boolean. Was a `error.permanent = true` error thrown? (if so, it will stop trying to fetch).
* `select{{Name}}ShouldUpdate`: Boolean. Based on last successful fetch, errors, loading state, should the content be updated?

## Changelog

* `20.0.0` - Mostly internal changes and bug fixes, can cause breakage if depending on action type names, or if using `composeBundlesRaw()` to handpick what's included.

  * Changed all action types to be past-tense (so they don't sound like RPC calls). Action types should describe things that happened, not sound like they're causing things to happen. So in asyncCount instead of `START`, `SUCCESS`, `ERROR` it's now `STARTED`, `FINISHED`, `FAILED`. In URL bundle `UPDATE_URL` -> `URL_UPDATED`. In geolocation bundle `REQUEST_GEOLOCATION_X` -> `GEOLOCATION_REQUEST_X`.
  * All included bundles that require instantiation with a config are now named `createXBundle` for consistency. This includes `createGeolocationBundle`, `createReactorBundle`, `createCacheBundle`.
  * Added docs to readme several of the included bundles.
  * Significant changes to `createAsyncResourceBundle`:
    * `actionBaseType` is now the noun, such as `USER`, from this we build `FETCH_USER_STARTED`, `USER_EXPIRED`, etc.
    * `doMarkXAsStale` is now `doMarkXAsOutdated`.
    * Action type names updated to be past tense: `MAKE_STALE` -> `X_INVALIDATED`
    * Added `doClearX` action creator and reducer case.
    * Now takes 3 time-related settings: `staleAfter`, `retryAfter`, and `expireAfter`.
    * Support for `expireAfter` was added, the `X_EXPIRED` action will be dispatched clearing the state.

* `19.0.1` - Minor fix for WebWorkers (updating redux-persist-middleware dep).
* `19.0.0` - Externalized caching lib as its own library called [money-clip](https://github.com/HenrikJoreteg/money-clip) and the caching bundle now uses [redux-persist-middleware](https://github.com/HenrikJoreteg/redux-persist-middleware) to generate it's persistance middleware. Nothing huge changes other than importing caching lib from outside of bundler. I've updated [redux-bundler-example](https://github.com/HenrikJoreteg/redux-bundler-example) for sample usage of caching bundle with money-clip. Renamed `cacheBundle` -> `createCacheBundle` since it needs to be configured to be used. Removed unused `npm-watch` dev dependency.
* `18.0.0` - Renamed `selectCurrentComponent` -> `selectRoute` in create route bundle.
* `17.1.1` - Fix bug where `requestAnimationFrame` was expected to exist when running inside a worker.
* `17.1.0` - Export `*` from redux in index.
* `17.0.1` - Fix to ensure publishing/mapping to correct build files :facepalm:.
* `17.0.0` - Switched to build with microbundle. Should address issues #5, #8. No longer pulling in redux-bundler version into build.
* `16.1.1` - Ensure all output from selectors of included bundles is serializable. `selectUrlObject()` in the url bundle was returning a `URL` object instance. Now it just returns a plain object with all string properties from the URL object. Did this as bug fix release because it was always intended this way. In theory it could could be a breaking change, but odds are miniscule. Only if someone were doing `selectUrlObject` then treating its resulting `searchParams` prop as a `URLSearchParams` object and calling its methods instead of using one of the selectors that already exist for accessing query params.
* `16.1.0` - Added `.action()` method to store for calling an action creator by name (useful when wanting to proxy all actions to another object, such as a web worker)
* `16.0.0` - First public release

## credits

If you like this follow [@HenrikJoreteg](http://twitter.com/henrikjoreteg) on twitter.

## license

[MIT](http://mit.joreteg.com/)
