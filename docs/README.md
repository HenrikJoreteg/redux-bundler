# Redux Bundler <iframe src="https://ghbtns.com/github-btn.html?user=henrikjoreteg&repo=redux-bundler&type=star&count=true" frameborder="0" style="" scrolling="0" width="160px" height="20px"></iframe>

Compose a Redux store out of smaller bundles of functionality.

Created by: [@HenrikJoreteg](http://twitter.com/henrikjoreteg)

## The basic idea

Organize all Redux-related code into a single flat folder of "redux bundles". A bundle is a single file for each main area of functionality in your app.

A bundle can optionally export things like:

1.  A name
2.  A reducer
3.  Action creators
4.  Selectors (functions for reading state)
5.  An init method

For example:

`bundles/users.js:`

```js
export default {
  // the name becomes the reducer name in the resulting state
  name: 'users',
  // the Redux reducer function
  reducer: (state = [], action) => {
    // ...
    return state
  },
  // anything that starts with `select` is treated as a selector
  selectActiveUsers: state => state.users.filter(user => user.isActive),
  // anything that starts with `do` is treated as an action creator
  doUpdateUser: (userId, attrs) => ({ dispatch, apiFetch }) =>
    dispatch({ type: 'USER_UPDATE_STARTED' })
    apiFetch('/users', { type: 'PUT' }, attrs)
      .then(res => {
        dispatch({ type: 'USER_UPDATE_FINISHED' })
      })
      .catch(err => {
        dispatch({ type: 'USER_UPDATE_FAILED' })
      }),
  // optional init method is ran after store is created and passed the
  // store object.
  init: store => {
    // action creators are bound and attached to store as methods
    store.doUpdateUser()

    // selectors are also "bound" and attached to store as methods
    store.selectActiveUsers()
  }
}
```

Redux-bundler then composes those "bundles" into a function that returns a ready-to-go Redux store.

Usually you'd just do this in the index file of your bundles directory:

`bundles/index.js:`

```js
import { composeBundles } from 'redux-bundler'
import usersBundle from './the/file/above'
import authBundle from './bundles/auth'
// ... import other bundles

export default composeBundles(
  usersBundle,
  viewportBundle
  // ... add bundles here
)
```

Then, in your root component, call the function exported by the bundles directory, pass it any initial data and you're up and running:

`components/root.js`

```js
import React from 'react'
import { render } from 'react-dom'
// similar to react-redux
// bindings available for React and Preact
import { Provider } from 'redux-bundler-react'
import App from './components/app'
// the file above exports a ready-to-go
// createStore function
import createStore from './bundles'

// you can also pass it initial data here if you have any
const store = createStore(window.BOOTSTRAP_DATA)

// render your app
render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.body.getElementById('app')
)
```

Now you can efficiently connect components with way less boilerplate:

`components/some-component.js`

```js
import React from 'react'

// pass as many names of selectors or action creators as you want
// in any order. Functionality is implied from the name so `doX`
// is an action. `selectX` is a selector.
//
// - action creators are pre-bound to the store.
// - selector names create prop names that sound like the value so
//   `selectActiveUsers` here, becomes: `activeUsers`
export default connect(
  'doUpdateUser',
  'selectActiveUsers',
  ({ doUpdateUser, activeUsers }) => (
    <div>
      {activeUsers.map(user => (
        <div>
          name: {user.name}
          <button
            onClick={() =>
              // action creators are pre-bound to the store
              doUpdateUser({
                isAwesome: true
              })
            }
          />
        </div>
      ))}
    </div>
  )
)
```

## Features

1.  This is not a toy project. This is how I build production Redux apps. It was extracted from real apps where it was used to solve real use cases.
1.  It's quite small at [~9k](https://bundlephobia.com/result?p=redux-bundler). That includes Redux itself, reselect for selectors, as well as an optional super light-weight routing system. If you pair it with [Preact](https://preactjs.com/) and [money-clip](https://github.com/HenrikJoreteg/money-clip) you have a complete PWA toolkit in ~14kb! That's before tree-shaking (could be much less if you don't use everything).
1.  Dramatically reduces boilerplate without changing or replacing basic Redux concepts.
1.  "Batteries included" approach where you use what you want, and tree-shake out the rest.
1.  Simplified and more efficient `connect()` for binding to components (available for [React](https://github.com/HenrikJoreteg/redux-bundler-react) and [Preact](https://github.com/HenrikJoreteg/redux-bundler-preact))
1.  Includes a very lightweight, robust, routing system (optional).
1.  Supports code-splitting/lazy-loading of Redux bundles.
1.  Makes re-use of Redux related code between apps really simple; just publish a bundle to npm.
1.  Full [example-app](https://github.com/HenrikJoreteg/redux-bundler-example) available demonstrating data fetching, clientside caching, routing, etc.
1.  Can run entirely in a WebWorker using [redux-bundler-worker](https://github.com/HenrikJoreteg/redux-bundler-worker) (complete [example app here](https://github.com/HenrikJoreteg/redux-bundler-worker-example)).
1.  Supports the "reactor" pattern letting your react to your application state to dispatch other actions. This lets you write a total "honey badger" of an app that can seamlessly recover from errors and tolerate terrible network conditions.

## Motivation

Redux is awesome, but it's no secret that using it requires writing a fair amount of boilerplate. There are some [tips for reducing it in the official documentation](https://redux.js.org/recipes/ReducingBoilerplate.html) and there's an [open issue with over 100 comments](https://github.com/reactjs/redux/issues/2295) on the redux repo about how to handle it that is left largely unresolved.

I've been building redux apps for quite some time and some of you may have been introduced to it when I first [blogged about it](https://blog.andyet.com/2015/08/06/what-the-flux-lets-redux/) back in 2015. This library is how I build redux apps, I finally decided to open source it.

As I said this isn't a toy project. I'm currently using this library in the three different production apps that power my online donation platform, [Speedy](https://speedy.gift). This also builds on some of the ideas that were originally conceived and battle-tested when I was helping Starbucks re-platform and build their [shiny new PWA](https://app.starbucks.com). The point is this is actually how I build things with Redux, and given the lack of "solutions" to the boilerplate issue, I decided to share it.

There's a sample application [the source is here](https://github.com/HenrikJoreteg/redux-bundler-example) which is a good way to see how to build something with it. It's [deployed here](https://redux-bundler.netlify.com/) so you can see how it all works when it's up and running.

Note: redux-bundler includes its dependencies for simplicity to minimize surface area for bugs due to version mismatches. It also exports all the exports from redux. So you can still do stuff like `import { combineReducers } from 'redux-bundler'`. However, this also means you end up with code from redux with the debug blocks `if (process.env.NODE_ENV !== "production")` still present. Build your app with NODE_ENV="production" before minification to strip that out for production. You can use DefinePlugin for webpack (http://stackoverflow.com/questions/30030031), loose-envify (https://github.com/zertosh/loose-envify) for browserify, or rollup-plugin-replace for Rollup (https://github.com/rollup/rollup-plugin-replace) to do this.

## What this enables

This approach of consolidating everything on the store actually enables some interesting things.

* Reuse of redux-related functionality across applications. (For example, I share an "authBundle" between 3 different apps built on the same API).
* You can make configurable bundles! You can write higher-level functions that returns a pre-configured bundle. This is _huge_ for reducing boilerplate for things like simple data fetches. See the included `createAsyncResourceBundle` for an example of this.
* Keep things tidy. Behavior is decoupled from display. Components can focus on what they do best: rendering their current props.
* It strongly enforces a set of conventions for building redux apps (this is important for larger teams, especially). For example, you have to name your selectors starting with `select`.
* Supports lazy-loading additional redux bundles even after you've created the store. The new bundles are integrated into the existing redux store. Since, connected components reference things by name instead of directly import functions the the components can be sent in different JS payload than the redux code that will power them because until they're actually used they can reference things that don't yet exist on the store.
* This lib also includes an integrated approach for how to react to certain state conditions in your app. You can define special selectors that start with `react` instead of `select` that will be evaluated on a regular basis and can return actions to trigger in response. This enables really, really interesting patterns of being able to recover from failure and retrying failed requests, etc. The level of reliability that can be achieved here is _very_ powerful especially for use in PWAs that may well be offline or have really poor network conditions.
* The fact that you _have to use a selector_ to get state from redux dramatically simplifies refactoring of large redux apps and avoids many performance pitfalls.
* You can pass an array of selector names you want to subscribe to and get a callback with changes for those particular selectors. By consolidates state diffing into a single spot in the store, `connect()` doesn't have to do any dirty checking, so the binding code becomes very simple.
* Connected action creators are already pre-bound to the store so you never have to import an action creator and then bind it before using it in your component, which I've found to be really confusing for developers learning redux.
* It includes a debug bundle you can enable to see nice summary of what's happening for each action that is dispatched.
* In debug mode (which is enabled by setting `localStorage.debug` to a truthy value) the store instance is bound to `window` allowing console debugging of all your selectors, action creators via the JS console. For example you can type stuff like `store.selectIsLoggedIn()` to see results or `store.doLogout()` to trigger that action creator even if you don't have UI built for that yet.
* It is uniquely well-suited for running inside a WebWorker. Because so much of your application logic lives in the resulting store, and because it lets you subscribe to changes and get deltas of the state you care about, this whole system is uniquely well suited for being ran off of the main thread. I've put together [an example app that runs entirely in a worker](https://github.com/HenrikJoreteg/redux-bundler-worker-example)

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

## What next?

* Learn exactly [what bundles can do](/api/bundle.html).
* Check out the example app here: [https://github.com/HenrikJoreteg/redux-bundler-example](https://github.com/HenrikJoreteg/redux-bundler-example) to see how to build an app with redux-bundler.
* Learn about all the functionality available in the [included bundles](/api/included-bundles.html).
* See the [patterns page](/guides/patterns.html) for tips on how to organize your code, and do things like caching and routing.

## license

[MIT](http://mit.joreteg.com/)
