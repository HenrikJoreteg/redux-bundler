# redux-app

Compose a larger redux app out of smaller bundles of redux functionality.

A set of opinionated conventions around creating redux apps.

I constantly find myself wanting to re-use chunks of redux app logic. Not components, mind you, redux reducers/selectors etc.

The UI is secondary... get your app out of my components! :)

## example

A redux bundle might have:

1. a reducer
2. a set of action constants
3. some selectors
4. some action creators
5. some effects (selectors/action creator pairs)

Bundles like these can be combined into a larger application with `redux-app`.

A bundle that simply time-stamps every single action could be as simple as:

`app-time-bundle.js`:

```js
export default {
  name: 'appTime',
  reducer: Date.now,
  selectAppTime: state => state.appTime
}
```

or you can make it a function that takes options to configured behavior dynamically.

```js
export default (name = 'appTime') => ({
  name,
  reducer: Date.now,
  selectAppTime: state => state[name]
})
```

Then to make an app of it:

```js
import { composeBundles } from 'redux-app'
import * as appTimeBundle from './app-time-bundle'

// the `composeBundles` function takes a list of bundles and produces
// a function that can be (optionally) passed data to create a store
const store = composeBundles(appTimeBundle)(initialData)
```

At this point this is a redux store.

## Simple rules

1. Data is always accessed via selectors.
2. Selectors *have* to take *the entire* state as an argument.
3. Selectors should be named starting with the word `select` such as `selectAppTime`.
4. Actions creators should be named starting with the word `do` such as `doLogin`.


## bundle API

Things bundles can contain:

### `bundle.name`

The only required attribute your bundle should supply. This will be used as the name of any exported reducer.

### `bundle.reducer` or `bundle.getReducer()`

If you export an item called `reducer` it is assumed it's a ready-to-user redux reducer. Sometimes you need to dynamically configure something like `initialData` in these cases a bundle can supply a `getReducer` function instead that will return a reducer.

### `bundle.select*` or `bundle.selectors`

Anything you attach that starts with `select` such as `selectUserData` will be assumed to be a selector function that takes the entire state object selects what you want out of it. Supports plain functions, selectors created with [reselect](https://github.com/reactjs/reselect), and selectors that are [meant to be resolved lazily](https://github.com/HenrikJoreteg/create-selector) :point_left: read more at that link.

If you prefer to be more explicit, pass an object of selector functions (names should still start with `select`) but some people prefer to be more explicit.

**important**: these selectors will be attached directly to, and "bound" to the store. For example if you create a selector called `selectSomeState` you'll be able to call `store.selectSomeState()` directly from anywhere you have access to the stroe (without needing to pass any arguments).

### `bundle.doX` or `bundle.actionCreators`

Similarly to selectors, if your bundle contains any keys named `doSomething` they'll be assumed to be action creators.

These will be bound to dispatch for you and attached to the store. So you can call `store.doSomething('cool')` directly.

You can also just have an object of these passed as `actionCreators`.

**important**: a slightly modified thunk middleware is included by default. So you always have access to `dispatch` within action creators as follows:

```js
const doSomething = (value) => ({dispatch}) =>
  dispatch({type: 'something', payload: value})
```

Note that unlike standard thunk that uses positional arguments, this passes an object containing `dispatch`, `getState`, and any other items included by bundles that define `extraArgs`.

### `bundle.extraArgs`

An object containing items you wish to make available to action creators of all bundles.

Commonly this would be used for passing things like api wrappers, configs, etcs.

### `bundle.extract`

A string corresponding to a key to extract from other bundles. The extracted value will be passed as an object to the `init` method. This allows you to write a bundle that extends the API of other bundles. For example, the `effects` capability described below is implemented as a bundle via `extract`.

### `bundle.init(store, [extractedStuff])`

This will be run *once* as a last step before the store is returned. It will be passed the `store` as an argument and any extracted items from other bundles (keyed by app name). This is useful for things like registering document level event handlers, or any other sort of initialization activity.

###  `bundle.effects`

Effects are an object of strings. They key is the name of a selector, the value is the string name of an action creator.

At each even dispatch, the selectors defined here will be run. If they return anything other than `null` the result of the selector will be passed to the action creator and dispatched.

This allows a simple, declarative way to ask questions of state, via selectors to trigger an effect via actionCreators without the need to introduce new approaches to deal with effects.

## Included bundles

This ships with a handful of bundles, none of which are added by default, but many of which you'll likely want.

- `appTimeBundle`: tracks current action cycle as part of state (useful for deterministic action creators)
- `asyncCountBundle`: tracks how many outstanding async actions are occuring (by action type naming conventions).
- `createRouteBundle`: returns a bundle when passed a route config.
- `urlBundle`: tracks, updates, and provides action creators for urls in the browser.
- `effects`: extracts effects and triggers them. Also triggers an `APP_IDLE` action every 30 seconds if no other action has occurred. This allows for discovery of stale data without user action.
- `inspectBundle`: Add this bundle last, set `localStorage.debug = true` in your console and it will print out description of your bundle and expose all your selectors, actionCreators and the `store` iteself to `window` for easy debugging. Also shows you effects to be triggered based on current state after each action.
