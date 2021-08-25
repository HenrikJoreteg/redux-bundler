# Top level API

## `composeBundles(...bundles)`

Returns a function that will return a fully configured store composed of all the bundles **including some built-in ones that you're likely to want**. If you have any data to use as starting state, it can be passed to this function.

Included bundles:

- `appTimeBundle`
- `asyncCountBundle`
- `onlineBundle`
- `createUrlBundle()`
- `createReactorBundle()`
- `debugBundle`

## `composeBundlesRaw(...bundles)`

Same as `composeBundles(...bundles)` but does not include anything bundles by default.

## `createSelector()`

Can be used to create selectors as described in the `selectX` section of the bundle API.

## `HAS_WINDOW`

Is `window` defined

## `IS_BROWSER`

Like `HAS_WINDOW` but also tries to determine if we're in a WebWorker.

## `raf`

Shim for `requestAnimationFrame` with fallback to `setTimeout(0)` for node.

## `ric`

Shim for `requestIdleCallback` with fallback to `setTimeout(0)` for node.

## Exports `*` from redux

As previously stated, this library includes Redux, so redux methods are exported too.
