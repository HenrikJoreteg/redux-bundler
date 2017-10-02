import { version } from '../../package.json'
import { HAS_DEBUG_FLAG } from '../utils'

const ENABLE = 'ENABLE_DEBUG'
const DISABLE = 'DISABLE_DEBUG'

export default {
  name: 'debug',
  reducer: (state = HAS_DEBUG_FLAG, {type}) => {
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
  init: (store) => {
    if (store.selectIsDebug()) {
      const names = store.bundles.map(bundle => bundle.name)
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
      const normal = 'font-weight: normal;'

      store.logSelectors = self.logSelectors = () => {
        if (!store.selectAll) return
        console.log('%cselectors:', colorGreen, store.selectAll())
      }

      store.logBundles = self.logBundles = () => {
        console.log('%cinstalled bundles:\n  %c%s', colorTitle, black, names.join('\n  '))
      }

      store.logActionCreators = self.logActionCreators = () => {
        console.groupCollapsed('%caction creators', colorOrange)
        actionCreators.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.logReactors = self.logReactors = () => {
        console.groupCollapsed('%creactors', colorOrange)
        store.reactors && store.reactors.forEach(name => console.log(name))
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

      console.groupCollapsed('%credux bundler v%s', colorTitle, version)
      store.logBundles()
      const exported = []
      for (const key in store) {
        if (key.indexOf('select') === 0 || key.indexOf('do') === 0) {
          exported.push(`${key}()`)
        }
      }
      exported.sort()
      exported.unshift('store')
      console.log(`%cattached to self/window:\n  %c${exported.join('\n  ')}`, colorTitle, black + normal)
      store.logSelectors()
      store.logReactors()
      console.groupEnd()
      if (store.isReacting) {
        console.log(`%cqueuing reaction:`, colorOrange)
      }
    }
  }
}
