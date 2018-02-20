'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var redux = require('redux');
var createSelector = require('create-selector');
var createRouteMatcher = _interopDefault(require('feather-route-matcher'));
var reselect = require('reselect');
var idbKeyVal = _interopDefault(require('idb-keyval'));
var qs = _interopDefault(require('querystringify'));

var appTime = {
  name: 'appTime',
  reducer: Date.now,
  selectAppTime: function (state) { return state.appTime; }
}

var changes = {
  START: 1,
  SUCCESS: -1,
  ERROR: -1
};

var re = /_(START|SUCCESS|ERROR)$/;

var asyncCount = {
  name: 'asyncCount',
  reducer: function (state, ref) {
    if ( state === void 0 ) state = 0;
    var type = ref.type;

    var result = re.exec(type);
    if (!result) { return state }
    return state + changes[result[1]]
  },
  selectAsyncActive: function (state) { return state.asyncCount > 0; }
}

function debugMiddleware (store) { return function (next) { return function (action) {
  var isDebug = store.getState().debug;

  if (isDebug) {
    console.group(action.type);
    console.info('action:', action);
  }

  var result = next(action);

  if (isDebug) {
    console.debug('state:', store.getState());
    self.logSelectors && self.logSelectors();
    self.logNextReaction && self.logNextReaction();
    console.groupEnd(action.type);
  }

  return result
}; }; }

function namedActionMiddleware (store) { return function (next) { return function (action) {
  var actionCreator = action.actionCreator;
  var args = action.args;
  if (actionCreator) {
    var found = store.meta.unboundActionCreators[actionCreator];
    if (!found) {
      throw Error(("NoSuchActionCreator: " + actionCreator))
    }
    return next(args ? found.apply(void 0, args) : found())
  }
  return next(action)
}; }; }

function thunkMiddleware (extraArgCreators) { return function (store) {
  var extraArgs = extraArgCreators.reduce(
    function (result, fn) { return Object.assign(result, fn(store)); },
    {}
  );
  return function (next) { return function (action) {
    if (typeof action === 'function') {
      var getState = store.getState;
      var dispatch = store.dispatch;
      return action(Object.assign({}, { getState: getState, dispatch: dispatch, store: store }, extraArgs))
    }
    return next(action)
  }; }
}; }

// Modified to expose all of `store` to middleware instead of just
// `getState` and `dispatch`
function customApplyMiddleware () {
  var middlewares = [], len = arguments.length;
  while ( len-- ) middlewares[ len ] = arguments[ len ];

  return function (createStore$$1) { return function (
  reducer,
  preloadedState,
  enhancer
) {
  var store = createStore$$1(reducer, preloadedState, enhancer);
  var dispatch = store.dispatch;
  var chain = [];
  chain = middlewares.map(function (middleware) { return middleware(store); });
  dispatch = redux.compose.apply(void 0, chain)(store.dispatch);
  return Object.assign(store, { dispatch: dispatch })
}; };
}

var debug = false;
try {
  debug = !!window.localStorage.debug;
} catch (e) {}
var HAS_DEBUG_FLAG = debug;
var HAS_WINDOW = typeof window !== 'undefined';
var IS_BROWSER = HAS_WINDOW || typeof self !== 'undefined';

var fallback = function (func) {
  setTimeout(func, 0);
};
var raf = IS_BROWSER ? self.requestAnimationFrame : fallback;
var ric =
  IS_BROWSER && self.requestIdleCallback ? self.requestIdleCallback : fallback;

var startsWith = function (string, searchString) { return string.substr(0, searchString.length) === searchString; };

var flattenExtractedToObject = function (extracted) {
  var result = {};
  for (var appName in extracted) {
    Object.assign(result, extracted[appName]);
  }
  return result
};

var flattenExtractedToArray = function (extracted) {
  var accum = [];
  for (var appName in extracted) {
    accum.push.apply(accum, extracted[appName]);
  }
  return accum
};

var addGlobalListener = function (eventName, handler) {
  if (IS_BROWSER) {
    self.addEventListener(eventName, handler);
  }
};

var selectorNameToValueName = function (name) {
  var start = name[0] === 's' ? 6 : 5;
  return name[start].toLowerCase() + name.slice(start + 1)
};

var debounce = function (fn, wait) {
  var timeout;
  var debounced = function () {
    var ctx = this;
    var args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      fn.apply(ctx, args);
    }, wait);
  };
  debounced.cancel = function () {
    clearTimeout(timeout);
  };
  return debounced
};

var obj;
var normalizeBundle = function (bundle) {
  var name = bundle.name;
  if (!name) { throw TypeError('bundles must have a "name" property') }
  var result = {
    name: name,
    reducer:
      bundle.reducer || (bundle.getReducer && bundle.getReducer()) || null,
    init: bundle.init || null,
    extraArgCreators: bundle.getExtraArgs || null,
    middlewareCreators: bundle.getMiddleware,
    actionCreators: null,
    selectors: null,
    reactorNames: null,
    rawBundle: bundle
  };
  Object.keys(bundle).forEach(function (key) {
    if (startsWith(key, 'do')) {
      (result.actionCreators || (result.actionCreators = {}))[key] =
        bundle[key];
      return
    }
    var isSelector = startsWith(key, 'select');
    var isReactor = startsWith(key, 'react');
    if (isSelector || isReactor) {
      (result.selectors || (result.selectors = {}))[key] = bundle[key];
      if (isReactor) {
        (result.reactorNames || (result.reactorNames = [])).push(key);
      }
    }
  });
  return result
};

var createChunk = function (rawBundles) {
  var normalizedBundles = rawBundles.map(normalizeBundle);
  var result = {
    bundleNames: [],
    reducers: {},
    selectors: {},
    actionCreators: {},
    rawBundles: [],
    processedBundles: [],
    initMethods: [],
    middlewareCreators: [],
    extraArgCreators: [],
    reactorNames: []
  };
  normalizedBundles.forEach(function (bundle) {
    result.bundleNames.push(bundle.name);
    Object.assign(result.selectors, bundle.selectors);
    Object.assign(result.actionCreators, bundle.actionCreators);
    if (bundle.reducer) {
      Object.assign(result.reducers, ( obj = {}, obj[bundle.name] = bundle.reducer, obj));
    }
    if (bundle.init) { result.initMethods.push(bundle.init); }
    if (bundle.middlewareCreators) {
      result.middlewareCreators.push(bundle.middlewareCreators);
    }
    if (bundle.extraArgCreators) {
      result.extraArgCreators.push(bundle.extraArgCreators);
    }
    if (bundle.reactorNames) { (ref = result.reactorNames).push.apply(ref, bundle.reactorNames); }
    result.processedBundles.push(bundle);
    result.rawBundles.push(bundle.rawBundle);
    var ref;
  });
  return result
};

function addBindingMethods (store) {
  store.subscriptions = {
    watchedValues: {}
  };
  var subscriptions = (store.subscriptions.set = new Set());
  var watchedSelectors = (store.subscriptions.watchedSelectors = {});

  var watch = function (selectorName) {
    watchedSelectors[selectorName] = (watchedSelectors[selectorName] || 0) + 1;
  };
  var unwatch = function (selectorName) {
    var count = watchedSelectors[selectorName] - 1;
    if (count === 0) {
      delete watchedSelectors[selectorName];
    } else {
      watchedSelectors[selectorName] = count;
    }
  };

  // add single store subscription for tracking watched changes
  store.subscribe(function () {
    var newValues = watchedSelectors.all
      ? store.selectAll()
      : store.select(Object.keys(watchedSelectors));
    var ref = store.subscriptions;
    var watchedValues = ref.watchedValues;

    // the only diffing in the app happens here
    var changed = {};
    for (var key in newValues) {
      var val = newValues[key];
      if (val !== watchedValues[key]) {
        changed[key] = val;
      }
    }

    store.subscriptions.watchedValues = newValues;

    // look through subscriptions to trigger
    subscriptions.forEach(function (subscription) {
      var relevantChanges = {};
      var hasChanged = false;
      if (subscription.names === 'all') {
        Object.assign(relevantChanges, changed);
        hasChanged = !!Object.keys(relevantChanges).length;
      } else {
        subscription.names.forEach(function (name) {
          if (changed.hasOwnProperty(name)) {
            relevantChanges[name] = changed[name];
            hasChanged = true;
          }
        });
      }
      if (hasChanged) {
        subscription.fn(relevantChanges);
      }
    });
  });

  // this exists separately in order to support
  // subscribing to all changes even after lazy-loading
  // additional bundles
  store.subscribeToAllChanges = function (callback) { return store.subscribeToSelectors('all', callback); };

  // given an array of selector names, it will call the
  // callback any time those have changed with an object
  // containing only changed values
  store.subscribeToSelectors = function (keys, callback) {
    var isAll = keys === 'all';
    // re-use loop for double duty
    // extract names, but also ensure
    // selector actually exists on store
    var subscription = {
      fn: callback,
      names: isAll ? 'all' : keys.map(selectorNameToValueName)
    };
    subscriptions.add(subscription);
    isAll ? watch('all') : keys.forEach(watch);

    // make sure starting values are in watched so we can
    // track changes
    Object.assign(
      store.subscriptions.watchedValues,
      isAll ? store.selectAll() : store.select(keys)
    );

    // return function that can be used to unsubscribe
    return function () {
      subscriptions.delete(subscription);
      isAll ? unwatch('all') : keys.forEach(unwatch);
    }
  };
}

var bindSelectorsToStore = function (store, selectors) {
  var loop = function ( key ) {
    var selector = selectors[key];
    if (!store[key]) {
      store[key] = function () { return selector(store.getState()); };
    }
  };

  for (var key in selectors) loop( key );
};

var decorateStore = function (store, processed) {
  if (!store.meta) {
    store.meta = {
      chunks: [],
      unboundSelectors: {},
      unboundActionCreators: {},
      reactorNames: []
    };
  }

  var meta = store.meta;

  // attach for reference
  meta.chunks.push(processed);

  // grab existing unbound (but resolved) selectors, combine with new ones
  var combinedSelectors = Object.assign(
    meta.unboundSelectors,
    processed.selectors
  );

  // run resolver
  createSelector.resolveSelectors(combinedSelectors);

  // update collection of resolved selectors
  meta.unboundSelectors = combinedSelectors;

  // make sure all selectors are bound (won't overwrite if already bound)
  bindSelectorsToStore(store, combinedSelectors);

  // build our list of reactor names
  meta.reactorNames = meta.reactorNames.concat(processed.reactorNames);

  // extend global collections with new stuff
  Object.assign(meta.unboundActionCreators, processed.actionCreators);

  // bind and attach only the next action creators to the store
  Object.assign(
    store,
    redux.bindActionCreators(processed.actionCreators, store.dispatch)
  );

  // run any new init methods
  processed.initMethods.forEach(function (fn) { return fn(store); });
};

var enableBatchDispatch = function (reducer) { return function (state, action) {
  if (action.type === 'BATCH_ACTIONS') {
    return action.actions.reduce(reducer, state)
  }
  return reducer(state, action)
}; };

var composeBundles = function () {
  var bundles = [], len = arguments.length;
  while ( len-- ) bundles[ len ] = arguments[ len ];

  // build out object of extracted bundle info
  var firstChunk = createChunk(bundles);

  return function (data) {
    // actually init our store
    var store = redux.createStore(
      enableBatchDispatch(redux.combineReducers(firstChunk.reducers)),
      data,
      customApplyMiddleware.apply(
        void 0, [
          namedActionMiddleware,
          thunkMiddleware(firstChunk.extraArgCreators),
          debugMiddleware ].concat( firstChunk.middlewareCreators.map(function (fn) { return fn(firstChunk); })
        )
      )
    );

    // upgrade dispatch to take multiple and automatically
    // batch dispatch in that case
    var dispatch = store.dispatch;
    store.dispatch = function () {
        var actions = [], len = arguments.length;
        while ( len-- ) actions[ len ] = arguments[ len ];

        return dispatch(
        actions.length > 1 ? { type: 'BATCH_ACTIONS', actions: actions } : actions[0]
      );
    };

    // get values from an array of selector names
    store.select = function (selectorNames) { return selectorNames.reduce(function (obj, name) {
        if (!store[name]) { throw Error(("SelectorNotFound " + name)) }
        obj[selectorNameToValueName(name)] = store[name]();
        return obj
      }, {}); };

    // get all values from all available selectors (even if added later)
    store.selectAll = function () { return store.select(Object.keys(store.meta.unboundSelectors)); };

    // add support for dispatching an action by name
    store.action = function (name, args) { return store[name].apply(store, args); };

    // adds support for subscribing to changes from an array of selector strings
    addBindingMethods(store);

    // add all the gathered bundle data into the store
    decorateStore(store, firstChunk);

    // defines method for integrating other bundles later
    store.integrateBundles = function () {
      var bundlesToIntegrate = [], len = arguments.length;
      while ( len-- ) bundlesToIntegrate[ len ] = arguments[ len ];

      decorateStore(store, createChunk(bundlesToIntegrate));
      var allReducers = store.meta.chunks.reduce(
        function (accum, chunk) { return Object.assign(accum, chunk.reducers); },
        {}
      );
      store.replaceReducer(enableBatchDispatch(redux.combineReducers(allReducers)));
    };

    return store
  }
};

function createRoutingBundle (routes) { return ({
  name: 'routes',
  selectRouteInfo: createSelector.createSelector('selectPathname', createRouteMatcher(routes)),
  selectRouteParams: createSelector.createSelector('selectRouteInfo', function (ref) {
    var params = ref.params;

    return params;
  }),
  selectCurrentComponent: createSelector.createSelector('selectRouteInfo', function (ref) {
    var page = ref.page;

    return page;
  })
}); }

var OFFLINE = 'OFFLINE';
var ONLINE = 'ONLINE';

var online = {
  name: 'online',
  selectIsOnline: function (state) { return state.online; },
  reducer: function (state, ref) {
    if ( state === void 0 ) state = true;
    var type = ref.type;

    if (type === OFFLINE) { return false }
    if (type === ONLINE) { return true }
    return state
  },
  init: function (store) {
    addGlobalListener('online', function () { return store.dispatch({ type: ONLINE }); });
    addGlobalListener('offline', function () { return store.dispatch({ type: OFFLINE }); });
  }
}

var createTimeCheckSelector = function (timeSelector, age, invert) {
    if ( invert === void 0 ) invert = true;

    return reselect.createSelector(timeSelector, appTime.selectAppTime, function (time, appTime$$1) {
    if (!time) {
      return false
    }
    var elapsed = appTime$$1 - time;
    if (invert) {
      return elapsed > age
    } else {
      return elapsed < age
    }
  });
};

var defaultOpts = {
  name: null,
  getPromise: null,
  actionBaseType: null,
  staleAge: 900000, // fifteen minutes
  retryAfter: 60000, // one minute,
  checkIfOnline: true,
  persist: true
};

function createAsyncResource (spec) {
  var opts = Object.assign({}, defaultOpts, spec);
  var name = opts.name;
  var staleAge = opts.staleAge;
  var retryAfter = opts.retryAfter;
  var actionBaseType = opts.actionBaseType;
  var checkIfOnline = opts.checkIfOnline;
  var uCaseName = name.charAt(0).toUpperCase() + name.slice(1);

  if (process.env.NODE_ENV !== 'production') {
    for (var item in opts) {
      if (opts[item] === null) {
        throw Error(
          ("You must supply an " + item + " option when creating a resource bundle")
        )
      }
    }
  }

  // build selectors
  var inputSelector = function (state) { return state[name]; };
  var dataSelector = reselect.createSelector(
    inputSelector,
    function (resourceState) { return resourceState.data; }
  );
  var lastSuccessSelector = reselect.createSelector(
    inputSelector,
    function (resource) { return resource.lastSuccess; }
  );
  var lastErrorSelector = reselect.createSelector(
    inputSelector,
    function (resource) { return resource.errorTimes.slice(-1)[0] || null; }
  );
  var isStaleSelector = createTimeCheckSelector(lastSuccessSelector, staleAge);
  var isWaitingToRetrySelector = createTimeCheckSelector(
    lastErrorSelector,
    retryAfter,
    false
  );
  var isLoadingSelector = reselect.createSelector(
    inputSelector,
    function (resourceState) { return resourceState.isLoading; }
  );
  var failedPermanentlySelector = reselect.createSelector(
    inputSelector,
    function (resourceState) { return resourceState.failedPermanently; }
  );
  var shouldUpdateSelector = reselect.createSelector(
    isLoadingSelector,
    failedPermanentlySelector,
    isWaitingToRetrySelector,
    dataSelector,
    isStaleSelector,
    online.selectIsOnline,
    function (
      isLoading,
      failedPermanently,
      isWaitingToRetry,
      data,
      isStale,
      isOnline
    ) {
      if (
        (checkIfOnline && !isOnline) ||
        isLoading ||
        failedPermanently ||
        isWaitingToRetry
      ) {
        return false
      }
      if (!data) {
        return true
      }
      return isStale
    }
  );

  var actions = {
    START: (actionBaseType + "_START"),
    SUCCESS: (actionBaseType + "_SUCCESS"),
    ERROR: (actionBaseType + "_ERROR"),
    MAKE_STALE: (actionBaseType + "_MAKE_STALE")
  };

  var initialState = {
    isLoading: false,
    data: null,
    errorTimes: [],
    lastSuccess: null,
    stale: false,
    failedPermanently: false
  };

  var doFetchError = function (error) { return ({ type: actions.ERROR, error: error }); };
  var doMarkAsStale = function (error) { return ({ type: actions.ERROR, error: error }); };
  var doFetchSuccess = function (payload) { return ({ type: actions.SUCCESS, payload: payload }); };
  var doFetchData = function () { return function (args) {
    var dispatch = args.dispatch;
    dispatch({ type: actions.START });
    return opts.getPromise(args).then(
      function (payload) {
        dispatch(doFetchSuccess(payload));
      },
      function (error) {
        dispatch(doFetchError(error));
      }
    )
  }; };

  var result = {
    name: name,
    reducer: function (state, ref) {
      if ( state === void 0 ) state = initialState;
      var type = ref.type;
      var payload = ref.payload;
      var error = ref.error;
      var merge = ref.merge;

      if (type === actions.START) {
        return Object.assign({}, state, { isLoading: true })
      }
      if (type === actions.SUCCESS) {
        var updatedData;
        if (merge) {
          updatedData = Object.assign({}, state.data, payload);
        } else {
          updatedData = payload;
        }
        return Object.assign({}, state, {
          isLoading: false,
          data: updatedData,
          lastSuccess: Date.now(),
          errorTimes: [],
          failedPermanently: false,
          stale: false
        })
      }
      if (type === actions.ERROR) {
        return Object.assign({}, state, {
          isLoading: false,
          errorTimes: state.errorTimes.concat([Date.now()]),
          failedPermanently: !!(error && error.permanent)
        })
      }
      if (type === actions.MAKE_STALE) {
        return Object.assign({}, state, {
          errorTimes: [],
          stale: true
        })
      }
      return state
    }
  };
  result[("select" + uCaseName + "Raw")] = inputSelector;
  result[("select" + uCaseName)] = dataSelector;
  result[("select" + uCaseName + "IsStale")] = isStaleSelector;
  result[("select" + uCaseName + "LastError")] = lastErrorSelector;
  result[("select" + uCaseName + "IsWaitingToRetry")] = isWaitingToRetrySelector;
  result[("select" + uCaseName + "IsLoading")] = isLoadingSelector;
  result[("select" + uCaseName + "FailedPermanently")] = failedPermanentlySelector;
  result[("select" + uCaseName + "ShouldUpdate")] = shouldUpdateSelector;
  result[("doFetch" + uCaseName)] = doFetchData;
  result[("doFetch" + uCaseName + "Success")] = doFetchSuccess;
  result[("doFetch" + uCaseName + "Error")] = doFetchError;
  result[("doMark" + uCaseName + "AsStale")] = doMarkAsStale;

  if (opts.persist) {
    result.persistActions = [actions.SUCCESS];
  }

  return result
}

// Thin layer on top of idb-keyval with support for versioning and
// max age
var defaultOpts$1 = { maxAge: Infinity, version: 0, lib: idbKeyVal };

var getCachedItem = function (key, opts) {
  var ref = Object.assign({}, defaultOpts$1, opts);
  var maxAge = ref.maxAge;
  var version = ref.version;
  var lib = ref.lib;
  return lib
    .get(key)
    .then(JSON.parse)
    .then(function (parsed) {
      var age = Date.now() - parsed.time;
      if (age > maxAge || version !== parsed.version) {
        lib.delete(key);
        return null
      }
      return {
        age: age,
        data: parsed.data
      }
    })
    .catch(function () { return null; })
};

var getAllCached = function (spec) {
  var opts = Object.assign({}, defaultOpts$1, spec);
  var keys;
  return opts.lib
    .keys()
    .then(function (retrievedKeys) {
      keys = retrievedKeys;
      return Promise.all(
        keys.map(function (key) { return getCachedItem(key, opts).then(function (res) { return res.data; }); })
      )
    })
    .then(function (data) { return data.reduce(function (acc, bundleData, index) {
        if (bundleData) {
          acc[keys[index]] = bundleData;
        }
        return acc
      }, {}); }
    )
    .catch(function () {})
};

var clearAllCached = function (opts) {
    if ( opts === void 0 ) opts = defaultOpts$1;

    return opts.lib.clear().catch(function () { return null; });
};

var cacheItem = function (key, data, spec) {
  var opts = Object.assign({}, defaultOpts$1, spec);
  return opts.lib
    .set(
      key,
      JSON.stringify({
        version: opts.version,
        time: Date.now(),
        data: data
      })
    )
    .catch(function () { return null; })
};

var defaults = { version: 0, cacheFunction: cacheItem };
function caching (spec) {
  var opts = Object.assign({}, defaults, spec);

  return {
    name: 'localCache',
    getMiddleware: function (chunk) {
      var combinedActions = {};
      chunk.rawBundles.forEach(function (bundle) {
        if (bundle.persistActions) {
          bundle.persistActions.forEach(function (type) {
            combinedActions[type] || (combinedActions[type] = []);
            combinedActions[type].push(bundle.name);
          });
        }
      });

      return function (ref) {
        var getState = ref.getState;

        return function (next) { return function (action) {
        var keys = combinedActions[action.type];
        var res = next(action);
        var state = getState();
        if (keys) {
          if (IS_BROWSER) {
            ric(function () {
              Promise.all(
                keys.map(function (key) { return opts.cacheFunction(key, state[key], { version: opts.version }); }
                )
              ).then(function () {
                if (state.debug) {
                  console.info(
                    ("persisted " + (keys.join(', ')) + " because of action " + (action.type))
                  );
                }
              });
            });
          }
        }
        return res
      }; };
      }
    }
  }
}

var getError = function (message, permanent) {
  if ( permanent === void 0 ) permanent = false;

  var err = new Error(message);
  if (permanent) { err.permanent = true; }
  return err
};

var geoErrorArray = [
  'An unknown geolocation error occured',
  'Geolocation permission denied',
  'Geolocation unavailable',
  'Geolocation request timed out'
];

var defaultOpts$2 = {
  timeout: 60000,
  enableHighAccuracy: false,
  persist: true,
  staleAge: 900000, // fifteen minutes
  retryAfter: 60000 // one minute,
};

function geolocation (spec) {
  var opts = Object.assign({}, defaultOpts$2, spec);
  return createAsyncResource({
    name: 'geolocation',
    actionBaseType: 'REQUEST_GEOLOCATION',
    getPromise: function () { return new Promise(function (resolve, reject) {
        if (!IS_BROWSER || !navigator.geolocation) {
          reject(getError('Geolocation not supported', true));
        }
        var success = function (position) {
          var res = {};
          var coords = position.coords;
          for (var key in coords) {
            res[key] = coords[key];
          }
          res.timestamp = position.timestamp;
          resolve(res);
        };
        var fail = function (ref) {
          var code = ref.code;

          reject(getError(geoErrorArray[code], code === 1));
        };
        var geoOpts = {
          timeout: opts.timeout,
          enableHighAccuracy: opts.enableHighAccuracy
        };
        navigator.geolocation.getCurrentPosition(success, fail, geoOpts);
      }); },
    persist: opts.persist,
    staleAge: opts.staleAge,
    retryAfter: opts.retryAfter
  })
}

var defaults$1 = {
  idleTimeout: 30000,
  idleAction: 'APP_IDLE',
  doneCallback: null,
  stopWhenTabInactive: true
};

var ricOptions = { timeout: 500 };
var getIdleDispatcher = function (stopWhenInactive, timeout, fn) { return debounce(function () {
    // the requestAnimationFrame ensures it doesn't run when tab isn't active
    stopWhenInactive ? raf(function () { return ric(fn, ricOptions); }) : ric(fn, ricOptions);
  }, timeout); };

function reactors (opts) { return ({
  name: 'reactors',
  init: function (store) {
    opts || (opts = {});
    Object.assign(opts, defaults$1);
    var idleAction = opts.idleAction;
    var idleTimeout = opts.idleTimeout;
    var idleDispatcher;
    if (idleTimeout) {
      idleDispatcher = getIdleDispatcher(
        opts.stopWhenTabInactive,
        idleTimeout,
        function () { return store.dispatch({ type: idleAction }); }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      store.meta.reactorNames.forEach(function (name) {
        if (!store[name]) {
          throw Error(
            ("Reactor '" + name + "' not found on the store. Make sure you're defining as selector by that name.")
          )
        }
      });
    }

    var cancelIfDone = function () {
      if (
        !IS_BROWSER &&
        !store.nextReaction &&
        (!store.selectAsyncActive || !store.selectAsyncActive())
      ) {
        idleDispatcher && idleDispatcher.cancel();
        opts.doneCallback && opts.doneCallback();
      }
    };

    var dispatchNext = function () {
      // one at a time
      if (store.nextReaction) {
        return
      }
      // look for the next one
      store.meta.reactorNames.some(function (name) {
        var result = store[name]();
        if (result) {
          store.activeReactor = name;
          store.nextReaction = result;
        }
        return result
      });
      if (store.nextReaction) {
        // let browser chill
        ric(function () {
          var nextReaction = store.nextReaction;
          store.activeReactor = null;
          store.nextReaction = null;
          store.dispatch(nextReaction);
        }, ricOptions);
      }
    };

    var callback = function () {
      dispatchNext();
      if (idleDispatcher) {
        idleDispatcher();
        cancelIfDone();
      }
    };

    store.subscribe(callback);
    callback();
  }
}); }

var isString = function (obj) { return Object.prototype.toString.call(obj) === '[object String]'; };
var isDefined = function (thing) { return typeof thing !== 'undefined'; };
var ensureString = function (input) { return isString(input) ? input : qs.stringify(input); };
var IPRE = /^[0-9.]+$/;
var parseSubdomains = function (hostname, getBareHost) {
  if (IPRE.test(hostname)) { return [] }
  var parts = hostname.split('.');
  if (getBareHost) {
    return parts.slice(-2).join('.')
  }
  return hostname.split('.').slice(0, -2)
};
var removeLeading = function (char, string) { return string.charAt(0) === char ? string.slice(1) : string; };
var ensureLeading = function (char, string) {
  if (string === char || string === '') {
    return ''
  }
  return string.charAt(0) !== char ? char + string : string
};
var loc = (function () {
  if (!HAS_WINDOW) { return {} }
  return window.location
})();
var defaults$2 = {
  name: 'url',
  inert: !HAS_WINDOW,
  actionType: 'UPDATE_URL'
};

var makeSerializable = function (url) {
  var result = {};
  for (var key in url) {
    var val = url[key];
    if (isString(val)) {
      result[key] = val;
    }
  }
  return result
};

function url (opts) {
  var config = Object.assign({}, defaults$2, opts);
  var actionType = config.actionType;

  var selectUrlRaw = function (state) { return state[config.name]; };
  var selectUrlObject = createSelector.createSelector(selectUrlRaw, function (urlState) { return makeSerializable(new URL(urlState.url)); }
  );
  var selectQueryObject = createSelector.createSelector(selectUrlObject, function (urlObj) { return qs.parse(urlObj.search); }
  );
  var selectQueryString = createSelector.createSelector(selectQueryObject, function (queryObj) { return qs.stringify(queryObj); }
  );
  var selectPathname = createSelector.createSelector(
    selectUrlObject,
    function (urlObj) { return urlObj.pathname; }
  );
  var selectHash = createSelector.createSelector(selectUrlObject, function (urlObj) { return removeLeading('#', urlObj.hash); }
  );
  var selectHashObject = createSelector.createSelector(selectHash, function (hash) { return qs.parse(hash); });
  var selectHostname = createSelector.createSelector(
    selectUrlObject,
    function (urlObj) { return urlObj.hostname; }
  );
  var selectSubdomains = createSelector.createSelector(selectHostname, function (hostname) { return parseSubdomains(hostname); }
  );

  var doUpdateUrl = function (newState, opts) {
    if ( opts === void 0 ) opts = { replace: false };

    return function (ref) {
    var dispatch = ref.dispatch;
    var getState = ref.getState;

    var state = newState;
    if (typeof newState === 'string') {
      var parsed = new URL(
        newState.charAt(0) === '/' ? 'http://example.com' + newState : newState
      );
      state = {
        pathname: parsed.pathname,
        query: parsed.search || '',
        hash: parsed.hash || ''
      };
    }
    var url = new URL(selectUrlRaw(getState()).url);
    if (isDefined(state.pathname)) { url.pathname = state.pathname; }
    if (isDefined(state.hash)) { url.hash = ensureString(state.hash); }
    if (isDefined(state.query)) { url.search = ensureString(state.query); }
    dispatch({
      type: actionType,
      payload: { url: url.href, replace: opts.replace }
    });
  };
  };
  var doReplaceUrl = function (url) { return doUpdateUrl(url, { replace: true }); };
  var doUpdateQuery = function (query, opts) {
      if ( opts === void 0 ) opts = { replace: true };

      return doUpdateUrl({ query: ensureString(query) }, opts);
  };
  var doUpdateHash = function (hash, opts) {
      if ( opts === void 0 ) opts = { replace: false };

      return doUpdateUrl({ hash: ensureLeading('#', ensureString(hash)) }, opts);
  };

  return {
    name: config.name,
    init: function (store) {
      if (config.inert) {
        return
      }

      var lastState = store.selectUrlRaw();

      var setCurrentUrl = function () {
        store.doUpdateUrl({
          pathname: loc.pathname,
          hash: loc.hash,
          query: loc.search
        });
      };

      window.addEventListener('popstate', setCurrentUrl);

      store.subscribe(function () {
        var newState = store.selectUrlRaw();
        var newUrl = newState.url;
        if (lastState !== newState && newUrl !== loc.href) {
          try {
            window.history[newState.replace ? 'replaceState' : 'pushState'](
              {},
              null,
              newState.url
            );
            document.body.scrollTop = 0;
          } catch (e) {
            console.error(e);
          }
        }
        lastState = newState;
      });
    },
    getReducer: function () {
      var initialState = {
        url: !config.inert && HAS_WINDOW ? loc.href : '/',
        replace: false
      };

      return function (state, ref) {
        if ( state === void 0 ) state = initialState;
        var type = ref.type;
        var payload = ref.payload;

        if (type === '@@redux/INIT' && typeof state === 'string') {
          return {
            url: state,
            replace: false
          }
        }
        if (type === actionType) {
          return Object.assign({
            url: payload.url || payload,
            replace: !!payload.replace
          })
        }
        return state
      }
    },
    doUpdateUrl: doUpdateUrl,
    doReplaceUrl: doReplaceUrl,
    doUpdateQuery: doUpdateQuery,
    doUpdateHash: doUpdateHash,
    selectUrlRaw: selectUrlRaw,
    selectUrlObject: selectUrlObject,
    selectQueryObject: selectQueryObject,
    selectQueryString: selectQueryString,
    selectPathname: selectPathname,
    selectHash: selectHash,
    selectHashObject: selectHashObject,
    selectHostname: selectHostname,
    selectSubdomains: selectSubdomains
  }
}

var version = "16.1.3";

var ENABLE = 'ENABLE_DEBUG';
var DISABLE = 'DISABLE_DEBUG';

var debug$1 = {
  name: 'debug',
  reducer: function (state, ref) {
    if ( state === void 0 ) state = HAS_DEBUG_FLAG;
    var type = ref.type;

    if (type === ENABLE) {
      return true
    }
    if (type === DISABLE) {
      return false
    }
    return state
  },
  doEnableDebug: function () { return ({ type: ENABLE }); },
  doDisableDebug: function () { return ({ type: DISABLE }); },
  selectIsDebug: function (state) { return state.debug; },
  init: function (store) {
    if (store.selectIsDebug()) {
      var names = store.meta.chunks[0].bundleNames;
      self.store = store;
      var actionCreators = [];
      for (var key in store) {
        if (key.indexOf('do') === 0) {
          actionCreators.push(key);
        }
      }
      actionCreators.sort();
      var colorTitle = 'color: #1676D2;';
      var black = 'color: black;';
      var colorGreen = 'color: #4CAF50;';
      var colorOrange = 'color: #F57C00;';

      store.logSelectors = self.logSelectors = function () {
        if (!store.selectAll) { return }
        console.log('%cselectors:', colorGreen, store.selectAll());
      };

      store.logBundles = self.logBundles = function () {
        console.log(
          '%cinstalled bundles:\n  %c%s',
          colorTitle,
          black,
          names.join('\n  ')
        );
      };

      store.logActionCreators = self.logActionCreators = function () {
        console.groupCollapsed('%caction creators', colorOrange);
        actionCreators.forEach(function (name$$1) { return console.log(name$$1); });
        console.groupEnd();
      };

      store.logReactors = self.logReactors = function () {
        console.groupCollapsed('%creactors', colorOrange);
        var ref = store.meta;
        var reactorNames = ref.reactorNames;
        reactorNames.forEach(function (name$$1) { return console.log(name$$1); });
        console.groupEnd();
      };

      store.logNextReaction = self.logNextReaction = function () {
        var nextReaction = store.nextReaction;
        var activeReactor = store.activeReactor;
        if (nextReaction) {
          console.log(
            ("%cnext reaction:\n  %c" + activeReactor),
            colorOrange,
            black,
            nextReaction
          );
        }
      };

      console.groupCollapsed('%credux bundler v%s', colorTitle, version);
      store.logBundles();
      store.logSelectors();
      store.logReactors();
      console.groupEnd();
      if (store.isReacting) {
        console.log("%cqueuing reaction:", colorOrange);
      }
    }
  }
}

var appTimeBundle = appTime;
var asyncCountBundle = asyncCount;
var cachingBundle = caching;
var createRouteBundle = createRoutingBundle;
var createAsyncResourceBundle = createAsyncResource;
var reactorsBundle = reactors;
var getIdleDispatcher$1 = getIdleDispatcher;
var onlineBundle = online;
var urlBundle = url;
var debugBundle = debug$1;
var composeBundlesRaw = composeBundles;
var geolocationBundle = geolocation;
var composeBundles$1 = function () {
  var userBundles = [], len = arguments.length;
  while ( len-- ) userBundles[ len ] = arguments[ len ];

  userBundles || (userBundles = []);
  var bundles = [
    appTime,
    asyncCount,
    online,
    url(),
    reactors(),
    debug$1 ].concat( userBundles
  );
  return composeBundles.apply(void 0, bundles)
};

exports.appTimeBundle = appTimeBundle;
exports.asyncCountBundle = asyncCountBundle;
exports.cachingBundle = cachingBundle;
exports.createRouteBundle = createRouteBundle;
exports.createAsyncResourceBundle = createAsyncResourceBundle;
exports.reactorsBundle = reactorsBundle;
exports.getIdleDispatcher = getIdleDispatcher$1;
exports.onlineBundle = onlineBundle;
exports.urlBundle = urlBundle;
exports.debugBundle = debugBundle;
exports.composeBundlesRaw = composeBundlesRaw;
exports.geolocationBundle = geolocationBundle;
exports.composeBundles = composeBundles$1;
exports.createSelector = createSelector.createSelector;
exports.resolveSelectors = createSelector.resolveSelectors;
exports.HAS_DEBUG_FLAG = HAS_DEBUG_FLAG;
exports.HAS_WINDOW = HAS_WINDOW;
exports.IS_BROWSER = IS_BROWSER;
exports.raf = raf;
exports.ric = ric;
exports.startsWith = startsWith;
exports.flattenExtractedToObject = flattenExtractedToObject;
exports.flattenExtractedToArray = flattenExtractedToArray;
exports.addGlobalListener = addGlobalListener;
exports.selectorNameToValueName = selectorNameToValueName;
exports.debounce = debounce;
exports.getCachedItem = getCachedItem;
exports.getAllCached = getAllCached;
exports.clearAllCached = clearAllCached;
exports.cacheItem = cacheItem;
