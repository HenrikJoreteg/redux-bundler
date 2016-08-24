# redux-app

Compose a larger redux app out of smaller bundles of redux functionality.

This is merely a set of opinionated conventions around creating redux apps.

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
export const name = 'appTime'
export const reducer = Date.now
export const selectAppTime = state => state.appTime
```

or written in node.js style

```js
module.exports = {
  name: 'appTime',
  reducer: Date.now,
  selectAppTime: state => state.appTime
}
```

Then to make an app of it:

```js
import { composeApp } from 'redux-app'
import * as appTimeBundle from './app-time-bundle'

// the `composeApp` function takes a list of bundles and produces
// a function that can be (optionally) passed data to create a store
const store = composeApp(appTimeBundle)(initialData)
```

At this point this is a redux store.

```js
const selectIsNew = createSelector(
  'selectAppTime',
  appTime => appTime > 1471923095721
)
```



## Simple rules

1. Data is always accessed via selectors.
2. Selectors *have* to take *the entire* state as an argument.
3. Selectors should be named starting with the word `select` such as `selectAppTime`.
4. Actions creators should be named starting with the word `do` such as `doLogin`.
