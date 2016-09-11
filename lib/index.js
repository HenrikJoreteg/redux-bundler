'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var redux = require('redux');
var createSelector = require('create-selector');
var createRouteMatcher = _interopDefault(require('feather-route-matcher'));
var debounce = _interopDefault(require('lodash/debounce'));
var requestIdleCallback = _interopDefault(require('ric-shim'));
var URL = _interopDefault(require('url-parse'));
var qs = _interopDefault(require('querystringify'));

var appTime = {
  name: 'appTime',
  getReducer: function () {
    var now = Date.now()
    return function (state, ref) {
      if ( state === void 0 ) state = now;
      var type = ref.type;

      if (type.charAt(0) !== '@') {
        return Date.now()
      }
      return state
    }
  },
  selectAppTime: function (state) { return state.appTime; }
}

var changes = {
  'START': 1,
  'SUCCESS': -1,
  'ERROR': -1
}

var asyncCount = {
  name: 'asyncCount',
  reducer: function (state, ref) {
    if ( state === void 0 ) state = 0;
    var type = ref.type;

    var last = type.split('_').slice(-1)[0]
    return state + (changes[last] || 0)
  },
  selectAsyncActive: function (state) { return state.asyncCount > 0; }
}

var debug
try { debug = window.localStorage.debug } catch (e) {}

var debugMiddleware = function (store) { return function (next) { return function (action) {
  if (debug) {
    console.group(action.type)
    console.info('action:', action)
  }

  var result = next(action)

  if (debug) {
    console.debug('state:', store.getState())
    window.listSelectors && window.listSelectors()
    window.listActiveEffects && window.listActiveEffects()
    console.groupEnd(action.type)
  }

  return result
}; }; }

function createThunkMiddleware (extra) {
  return function (ref) {
    var dispatch = ref.dispatch;
    var getState = ref.getState;

    return function (next) { return function (action) {
    if (typeof action === 'function') {
      return action(Object.assign({dispatch: dispatch, getState: getState}, extra))
    }
    return next(action)
  }; };
  }
}

var thunk = createThunkMiddleware()
thunk.withExtraArgs = createThunkMiddleware

var compose = function () {
  var bundles = [], len = arguments.length;
  while ( len-- ) bundles[ len ] = arguments[ len ];

  var reducers = {}
  var initMethods = {}
  var extraArgs = {}
  var actionCreators = {}
  var selectors = {}
  var itemsToExtract = {}

  // not real pretty, but it means we only have
  // to loop through everything once
  bundles.forEach(function (bundle) {
    var name = bundle.name
    Object.keys(bundle).forEach(function (key) {
      var value = bundle[key]
      if (key === 'reducer') {
        reducers[name] = value
        return
      }
      if (key === 'getReducer') {
        reducers[name] = value()
        return
      }
      if (key === 'init') {
        initMethods[name] = value
        return
      }
      if (key === 'extraArgs') {
        Object.assign(extraArgs, value)
        return
      }
      if (key === 'extract') {
        itemsToExtract[name] = bundles
          .map(function (bundle) { return bundle[value]; })
          .filter(function (item) { return item; })
      }
      if (key.indexOf('do') === 0) {
        var obj = {}
        obj[key] = value
        Object.assign(actionCreators, obj)
        return
      }
      if (key.indexOf('select') === 0) {
        var obj$1 = {}
        obj$1[key] = value
        Object.assign(selectors, obj$1)
        return
      }
    })
  })

  return function (data, opts) {
    if ( opts === void 0 ) opts = {};

    var store = redux.createStore(
      redux.combineReducers(reducers),
      data,
      redux.applyMiddleware(
        thunk.withExtraArgs(extraArgs),
        debugMiddleware
      )
    )

    var boundActionCreators = redux.bindActionCreators(actionCreators, store.dispatch)

    createSelector.resolveSelectors(selectors)

    // bind to store
    var loop = function ( key ) {
      var selector = selectors[key]
      selectors[key] = function () { return selector(store.getState()); }
    };

    for (var key in selectors) loop( key );

    Object.assign(store, boundActionCreators, selectors)

    for (var appName in initMethods) {
      initMethods[appName](store, itemsToExtract[appName])
    }

    return store
  }
}

var version = "2.0.0";

var debug$1
try {
  debug$1 = !!(window.localStorage.debug)
} catch (e) {}

var inspect = {
  name: 'inspect',
  extract: 'name',
  init: function (store, names) {
    if (debug$1) {
      window.store = store
      var selectors = []
      var actionCreators = []
      for (var key in store) {
        var item = store[key]
        if (key.indexOf('select') === 0) {
          window[key] = item
          selectors.push(key)
        } else if (key.indexOf('do') === 0) {
          window[key] = item
          actionCreators.push(key)
        }
      }
      var colorTitle = 'color: #1676D2;'
      var black = 'color: black;'
      var colorGreen = 'color: #4CAF50;'
      var colorOrange = 'color: #F57C00;'
      var colorRed = 'color: #F44336;'
      var normal = 'font-weight: normal;'

      store.listSelectors = window.listSelectors = function () {
        var results = {}
        selectors.sort().forEach(function (selectorName) {
          results[selectorName] = store[selectorName]()
        })
        console.log('%cselectors:', colorGreen, results)
      }

      store.listBundles = window.listBundles = function () {
        console.log('%cinstalled bundles:\n  %c%s', colorTitle, black, names.join('\n  '))
      }

      store.listActionCreators = window.listActionCreators = function () {
        console.groupCollapsed('%caction creators', colorOrange)
        actionCreators.forEach(function (name) { return console.log(name); })
        console.groupEnd()
      }

      store.listEffects = window.listEffects = function () {
        var string = ''
        for (var selectorName in store.effects) {
          string += "\n  " + selectorName + " -> " + (store.effects[selectorName])
        }
        console.log('%ceffects:%c%s', colorOrange, black, string)
      }

      store.listActiveEffects = window.listActiveEffects = function () {
        var activeEffectQueue = store.activeEffectQueue;
        if (activeEffectQueue.length) {
          var selectorName = activeEffectQueue[0]
          var actionCreatorName = store.effects[selectorName]
          var result = store[selectorName]()
          console.log(
            ("%cnext effect:\n  %c%s() -> %c" + actionCreatorName + "(%c" + (JSON.stringify(result)) + "%c)"),
            colorOrange,
            black,
            selectorName,
            colorRed,
            black,
            colorRed
          )
          if (activeEffectQueue.length > 1) {
            console.log('%cqueued effects:', colorRed, activeEffectQueue.slice(1).join(', '))
          }
        }
      }

      console.groupCollapsed('%credux bundler v%s', colorTitle, version)
      store.listBundles()
      var exported = []
      for (var key$1 in store) {
        if (key$1.indexOf('select') === 0 || key$1.indexOf('do') === 0) {
          exported.push((key$1 + "()"))
        }
      }
      exported.unshift('store')
      console.log(("%cattached to window:\n  %c" + (exported.join('\n  '))), colorTitle, black + normal)
      store.listSelectors()
      store.listEffects()
      console.groupEnd()
      store.listActiveEffects()
    }
  }
}

var createRoutingBundle = function (routes) { return ({
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

var IS_BROWSER = typeof window !== 'undefined' || typeof self !== 'undefined'

var raf =
  (IS_BROWSER && require('component-raf')) ||
  (function (func) { setTimeout(func, 0) })

var defaults = {
  idleTimeout: 30000,
  idleAction: 'APP_IDLE'
}

var createBundle = function (opts) { return ({
  name: 'reactiveDispatch',
  extract: 'effects',
  init: function (store, effects) {
    if ( effects === void 0 ) effects = [];

    opts || (opts = {})
    Object.assign(opts, defaults)
    var idleAction = opts.idleAction;
    var idleTimeout = opts.idleTimeout;
    var idleDispatcher = debounce(function () {
      raf(function () { return store.dispatch({type: idleAction}); })
    }, idleTimeout)

    // flatten
    var effectObj = effects.reduce(function (acc, effectObj) {
      for (var item in effectObj) {
        // helpful development errors
        if (process.env.NODE_ENV !== 'production') {
          var actionName = effectObj[item]
          if (!store[item]) {
            throw Error(("Effect key '" + item + "' does not exist on the store. Make sure you're defining as selector by that name."))
          }
          if (!store[actionName]) {
            throw Error(("Effect value '" + actionName + "' does not exist on the store. Make sure you're defining an action creator by that name."))
          }
          if (acc[item]) {
            throw Error(("effect keys must be unique. An effect " + item + " is already defined"))
          }
          if (typeof actionName !== 'string') {
            throw Error(("Effect values must be strings. The effect " + item + " has a value that is: " + (typeof actionName)))
          }
        }
        acc[item] = effectObj[item]
      }
      return acc
    }, {})

    store.effects = effectObj
    store.activeEffectQueue = []

    var buildActiveEffectQueue = function () {
      for (var selectorName in store.effects) {
        var result = store[selectorName]()
        if (result !== null && store.activeEffectQueue.indexOf(selectorName) === -1) {
          store.activeEffectQueue.push(selectorName)
        }
      }
    }

    var dispatchNext = function () {
      requestIdleCallback(function () {
        var next = store.activeEffectQueue.shift()
        if (next) {
          // make sure it's still relevant
          var result = store[next]()
          if (result !== null) {
            var actionCreatorName = store.effects[next]
            store[actionCreatorName](result)
          }
        }
      })
    }

    var callback = function () {
      buildActiveEffectQueue()
      dispatchNext()
      idleDispatcher()
    }

    store.subscribe(callback)
    callback()
  }
}); }

var effects = createBundle()

var isDefined = function (thing) { return typeof thing !== 'undefined'; }
var ensureString = function (input) { return typeof input === 'string' ? input : qs.stringify(input); }
var IPRE = /^[0-9\.]+$/
var parseSubdomains = function (hostname) {
  if (IPRE.test(hostname)) return []
  return hostname.split('.').slice(0, -2)
}
var removeLeading = function (char, string) { return string.charAt(0) === char ? string.slice(1) : string; }
var ensureLeading = function (char, string) {
  if (string === char || string === '') {
    return ''
  }
  return string.charAt(0) !== char ? char + string : string
}
var loc = (function () {
  if (!IS_BROWSER) return {}
  return window.location || self.location
})()
var defaults$1 = {
  name: 'url',
  inert: !IS_BROWSER,
  actionType: 'UPDATE_URL'
}

var url = function (opts) {
  var config = Object.assign({}, defaults$1, opts)
  var actionType = config.actionType

  var selectUrlRaw = function (state) { return state[config.name]; }
  var selectUrlObject = createSelector.createSelector(selectUrlRaw, function (urlState) { return new URL(urlState.url, true); })
  var selectQueryObject = createSelector.createSelector(selectUrlObject, function (urlObj) { return urlObj.query; })
  var selectQueryString = createSelector.createSelector(selectQueryObject, function (queryObj) { return qs.stringify(queryObj); })
  var selectPathname = createSelector.createSelector(selectUrlObject, function (urlObj) { return urlObj.pathname; })
  var selectHash = createSelector.createSelector(selectUrlObject, function (urlObj) { return removeLeading('#', urlObj.hash); })
  var selectHashObject = createSelector.createSelector(selectHash, function (hash) { return qs.parse(hash); })
  var selectSubdomains = createSelector.createSelector(selectUrlObject, function (urlObj) { return parseSubdomains(urlObj.hostname); })

  var doUpdateUrl = function (newState, opts) {
    if ( opts === void 0 ) opts = {replace: false};

    return function (ref) {
    var dispatch = ref.dispatch;
    var getState = ref.getState;

    var state = (typeof newState === 'string') ? { pathname: newState, hash: '', query: '' } : newState
    var url = new URL(selectUrlRaw(getState()).url, true)
    if (isDefined(state.pathname)) url.set('pathname', state.pathname)
    if (isDefined(state.hash)) url.set('hash', ensureString(state.hash))
    if (isDefined(state.query)) url.set('query', ensureString(state.query))
    dispatch({ type: actionType, payload: { url: url.href, replace: opts.replace } })
  };
  }
  var doReplaceUrl = function (url) { return doUpdateUrl(url, {replace: true}); }
  var doUpdateQuery = function (query, opts) {
      if ( opts === void 0 ) opts = {replace: true};

      return doUpdateUrl({ query: ensureString(query) }, opts);
  }
  var doUpdateHash = function (hash, opts) {
      if ( opts === void 0 ) opts = {replace: false};

      return doUpdateUrl({ hash: ensureLeading('#', ensureString(hash)) }, opts);
  }

  return {
    name: config.name,
    init: function (store) {
      if (config.inert) {
        return
      }

      var lastState = store.selectUrlRaw()

      var setCurrentUrl = function () {
        store.doUpdateUrl({
          pathname: loc.pathname,
          hash: loc.hash,
          query: loc.search
        })
      }

      window.addEventListener('popstate', setCurrentUrl)

      store.subscribe(function () {
        var newState = store.selectUrlRaw()
        var newUrl = newState.url
        if (lastState !== newState && newUrl !== loc.href) {
          try {
            window.history[newState.replace ? 'replaceState' : 'pushState']({}, null, newState.url)
          } catch (e) {
            console.error(e)
          }
        }
        lastState = newState
      })

      window.addEventListener('popstate', setCurrentUrl)
    },
    getReducer: function () {
      var initialState = {
        url: !config.inert && IS_BROWSER
          ? loc.href
          : '/',
        replace: false
      }

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
    selectSubdomains: selectSubdomains
  }
}

var appTimeBundle = appTime
var asyncCountBundle = asyncCount
var inspectBundle = inspect
var composeBundles = compose
var createRouteBundle = createRoutingBundle
var effectsBundle = effects
var urlBundle = url

exports.appTimeBundle = appTimeBundle;
exports.asyncCountBundle = asyncCountBundle;
exports.inspectBundle = inspectBundle;
exports.composeBundles = composeBundles;
exports.createRouteBundle = createRouteBundle;
exports.effectsBundle = effectsBundle;
exports.urlBundle = urlBundle;
