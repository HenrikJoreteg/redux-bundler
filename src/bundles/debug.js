// import { version } from '../../package.json'
import { HAS_DEBUG_FLAG } from '../utils'
import debugMiddleware from '../middleware/debug'

const ENABLE = 'DEBUG_ENABLED'
const DISABLE = 'DEBUG_DISABLED'

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
  selectIsDebug: state => state.debug,
  getMiddleware: () => debugMiddleware,
  init: store => {
    if (store.selectIsDebug()) {
      const names = store.meta.chunks[0].bundleNames
      self.store = store
      const actionCreators = []
      for (const key in store) {
        if (key.indexOf('do') === 0) {
          actionCreators.push(key)
        }
      }
      actionCreators.sort()
      const colorTitle = 'color: #1676D2;'
      const black = 'color: black;'
      const colorGreen = 'color: #4CAF50;'
      const colorOrange = 'color: #F57C00;'

      store.logSelectors = self.logSelectors = () => {
        if (!store.selectAll) return
        console.log('%cselectors:', colorGreen, store.selectAll())
      }

      store.logBundles = self.logBundles = () => {
        console.log(
          '%cinstalled bundles:\n  %c%s',
          colorTitle,
          black,
          names.join('\n  ')
        )
      }

      store.logActionCreators = self.logActionCreators = () => {
        console.groupCollapsed('%caction creators', colorOrange)
        actionCreators.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logReactors = self.logReactors = () => {
        console.groupCollapsed('%creactors', colorOrange)
        const { reactorNames } = store.meta
        reactorNames.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logNextReaction = self.logNextReaction = () => {
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

      console.groupCollapsed('%credux bundler', colorTitle)
      store.logBundles()
      store.logSelectors()
      store.logReactors()
      console.groupEnd()
      if (store.isReacting) {
        console.log(`%cqueuing reaction:`, colorOrange)
      }
    }
  }
}
