// import { version } from '../../package.json'
import { HAS_DEBUG_FLAG } from '../utils'
import debugMiddleware from '../middleware/debug'

const ENABLE = 'DEBUG_ENABLED'
const DISABLE = 'DEBUG_DISABLED'
const colorTitle = 'color: #1676D2;'
const black = 'color: black;'
const colorGreen = 'color: #4CAF50;'
const colorOrange = 'color: #F57C00;'

export default {
  name: 'debug',
  reducer: (state = HAS_DEBUG_FLAG, { type }) => {
    if (type === ENABLE) {
      return true
    }
    if (type === DISABLE) {
      return false
    }
    return state
  },
  doEnableDebug: () => ({ type: ENABLE }),
  doDisableDebug: () => ({ type: DISABLE }),
  doLogBundles: () => ({ store }) => {
    const names = store.meta.chunks[0].bundleNames
    return console.log(
      '%cinstalled bundles:\n  %c%s',
      colorTitle,
      black,
      names.join('\n  ')
    )
  },
  doLogSelectors: () => ({ store }) => {
    if (!store.selectAll) return console.log('NOPE')
    console.log('%cselectors:', colorGreen, store.selectAll())
  },
  doLogReactors: () => ({ store }) => {
    console.groupCollapsed('%creactors', colorOrange)
    const { reactorNames } = store.meta
    reactorNames.forEach(name => console.log(name))
    console.groupEnd()
  },
  doLogActionCreators: () => ({ store }) => {
    const actionCreators = []
    for (const key in store) {
      if (key.indexOf('do') === 0) {
        actionCreators.push(key)
      }
    }
    actionCreators.sort()
    console.groupCollapsed('%caction creators', colorOrange)
    actionCreators.forEach(name => console.log(name))
    console.groupEnd()
  },
  doLogNextReaction: () => ({ store }) => {
    {
      const { nextReaction, activeReactor } = store
      if (nextReaction) {
        console.log(
          `%cnext reaction:\n  %c${activeReactor}`,
          colorOrange,
          black,
          nextReaction
        )
      }
    }
  },
  doLogEverything: () => ({ store }) => {
    console.groupCollapsed('%credux bundler', colorTitle)
    store.doLogBundles()
    store.doLogSelectors()
    store.doLogReactors()
    store.doLogActionCreators()
    store.doLogNextReaction()
    console.groupEnd()
    if (store.isReacting) {
      console.log(`%cqueuing reaction:`, colorOrange)
    }
  },
  selectIsDebug: state => state.debug,
  getMiddleware: () => debugMiddleware,
  init: store => {
    if (store.selectIsDebug()) {
      this.doLogEverything()
    }
  }
}
