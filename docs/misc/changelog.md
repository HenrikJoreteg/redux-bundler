# Change Log

* `21.0.0` - Adding scroll restoration handling. (many browsers already handle this well by default, but not FF or IE 11). This handles scroll position internally in the url bundle if used, it also exports the scroll restoration helper functions so that they can be used directly as well.
* `20.0.0` - Adding documentation site, wrote lots of docs and made mostly internal changes and bug fixes, can cause breakage if depending on action type names, or if using `composeBundlesRaw()` to handpick what's included.

  * Changed all action types to be past-tense (so they don't sound like RPC calls). Action types should describe things that happened, not sound like they're causing things to happen. So in asyncCount instead of `START`, `SUCCESS`, `ERROR` it's now `STARTED`, `FINISHED`, `FAILED`. In URL bundle `UPDATE_URL` -> `URL_UPDATED`. In geolocation bundle `REQUEST_GEOLOCATION_X` -> `GEOLOCATION_REQUEST_X`.
  * All included bundles that require instantiation with a config are now named `createXBundle` for consistency. This includes `createGeolocationBundle`, `createReactorBundle`, `createCacheBundle`.
  * Added lots of documentation to readme several of the included bundles.
  * Significant changes to `createAsyncResourceBundle`:
    * `actionBaseType` is now the noun, such as `USER`, from this we build `FETCH_USER_STARTED`, `USER_EXPIRED`, etc.
    * `doMarkXAsStale` is now `doMarkXAsOutdated`.
    * Action type names updated to be past tense: `MAKE_STALE` -> `X_INVALIDATED`
    * Added `doClearX` action creator and reducer case.
    * Now takes 3 time-related settings: `staleAfter`, `retryAfter`, and `expireAfter`.
    * Support for `expireAfter` was added, the `X_EXPIRED` action will be dispatched clearing the state.
  * Removed wonky batch dispatch quasi-middleware.

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
