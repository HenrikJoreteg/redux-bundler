import { version } from '../../package.json'
import { HAS_DEBUG_FLAG, IS_BROWSER } from '../utils'

export default spec => {
  const ENABLE = 'DEBUG_ENABLED'
  const DISABLE = 'DEBUG_DISABLED'
  const colorBlue = 'color: #1676D2;'
  const colorGreen = 'color: #4CAF50;'
  const colorOrange = 'color: #F57C00;'

  // cleans up color vars when used in node
  const log = (toLog, { method = 'log', label, color }) =>
    console[method](
      ...(IS_BROWSER ? [`%c${label}`, color, toLog] : [label, toLog])
    )

  const defaultOpts = {
    logSelectors: true,
    logState: true,
    enabled: HAS_DEBUG_FLAG,
    actionFilter: null
  }

  const opts = Object.assign({}, defaultOpts, spec)

  return {
    name: 'debug',
    reducer: (state = opts.enabled, { type }) => {
      if (type === ENABLE) {
        return true
      }
      if (type === DISABLE) {
        return false
      }
      return state
    },
    doEnableDebug:
      () =>
      ({ dispatch }) => {
        if (IS_BROWSER) {
          try {
            localStorage.debug = true
          } catch (e) {}
        }
        dispatch({ type: ENABLE })
      },
    doDisableDebug:
      () =>
      ({ dispatch }) => {
        if (IS_BROWSER) {
          try {
            delete localStorage.debug
          } catch (e) {}
        }
        dispatch({ type: DISABLE })
      },
    selectIsDebug: state => state.debug,
    getMiddleware: () => store => next => action => {
      const isDebug = store.getState().debug

      if (!isDebug || (opts.actionFilter && !opts.actionFilter(action))) {
        return next(action)
      }

      console.group(action.type)
      console.info('action:', action)

      const result = next(action)

      opts.logState && console.debug('state:', store.getState())
      opts.logSelectors && store.doLogSelectors()
      store.doLogNextReaction && store.doLogNextReaction()
      console.groupEnd(action.type)

      return result
    },
    doLogBundles:
      () =>
      ({ store }) => {
        log(
          store.meta.chunks.reduce((result, chunk) => {
            result.push(...chunk.bundleNames)
            return result
          }, []),
          { label: 'installed bundles:', color: colorBlue }
        )
      },
    doLogSelectors:
      () =>
      ({ store }) => {
        log(
          Object.keys(store.meta.unboundSelectors)
            .sort()
            .reduce((res, name) => {
              res[name] = store[name]()
              return res
            }, {}),
          {
            label: 'selectors:',
            color: colorGreen
          }
        )
      },
    doLogActionCreators:
      () =>
      ({ store }) => {
        log(Object.keys(store.meta.unboundActionCreators).sort(), {
          label: 'action creators:',
          color: colorOrange
        })
      },
    doLogReactors:
      () =>
      ({ store }) => {
        log(store.meta.reactorNames, { label: 'reactors:', color: colorOrange })
      },
    doLogNextReaction:
      () =>
      ({ store }) => {
        const { nextReaction } = store
        if (nextReaction) {
          const { name, result } = nextReaction
          log(result, {
            color: colorOrange,
            label: `next reaction ${name}:`
          })
        }
      },
    doLogDebugSummary:
      () =>
      ({ store }) => {
        store.doLogBundles()
        store.doLogSelectors()
        store.doLogActionCreators()
        store.doLogReactors()
        store.doLogNextReaction()
      },
    init: store => {
      if (store.selectIsDebug()) {
        if (IS_BROWSER) {
          globalThis.store = store
          console.groupCollapsed(`%credux bundler v${version}`, colorBlue)
          store.doLogDebugSummary()
          console.groupEnd()
        }
      }
    }
  }
}
