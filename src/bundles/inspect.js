import { version } from '../../package.json'

let debug
try {
  debug = !!(window.localStorage.debug)
} catch (e) {}

export default {
  name: 'inspect',
  extract: 'name',
  init: (store, extracted) => {
    if (debug) {
      const names = Object.keys(extracted)
      window.store = store
      const selectors = []
      const actionCreators = []
      for (const key in store) {
        const item = store[key]
        if (key.indexOf('select') === 0) {
          window[key] = item
          selectors.push(key)
        } else if (key.indexOf('do') === 0) {
          window[key] = item
          actionCreators.push(key)
        }
      }
      actionCreators.sort()
      selectors.sort()
      const colorTitle = 'color: #1676D2;'
      const black = 'color: black;'
      const colorGreen = 'color: #4CAF50;'
      const colorOrange = 'color: #F57C00;'
      const colorRed = 'color: #F44336;'
      const normal = 'font-weight: normal;'

      store.listSelectors = window.listSelectors = () => {
        const results = {}
        selectors.sort().forEach((selectorName) => {
          results[selectorName] = store[selectorName]()
        })
        console.log('%cselectors:', colorGreen, results)
      }

      store.listBundles = window.listBundles = () => {
        console.log('%cinstalled bundles:\n  %c%s', colorTitle, black, names.join('\n  '))
      }

      store.listActionCreators = window.listActionCreators = () => {
        console.groupCollapsed('%caction creators', colorOrange)
        actionCreators.forEach(name => console.log(name))
        console.groupEnd()
      }

      store.listEffects = window.listEffects = () => {
        let string = ''
        for (const selectorName in store.effects) {
          string += `\n  ${selectorName} -> ${store.effects[selectorName]}`
        }
        console.log('%ceffects:%c%s', colorOrange, black, string)
      }

      store.listActiveEffects = window.listActiveEffects = () => {
        const { activeEffectQueue } = store
        if (activeEffectQueue.length) {
          const selectorName = activeEffectQueue[0]
          const actionCreatorName = store.effects[selectorName]
          const result = store[selectorName]()
          console.log(
            `%cnext effect:\n  %c%s() -> %c${actionCreatorName}(%c${JSON.stringify(result)}%c)`,
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
      const exported = []
      for (const key in store) {
        if (key.indexOf('select') === 0 || key.indexOf('do') === 0) {
          exported.push(`${key}()`)
        }
      }
      exported.unshift('store')
      console.log(`%cattached to window:\n  %c${exported.join('\n  ')}`, colorTitle, black + normal)
      store.listSelectors()
      store.listEffects()
      console.groupEnd()
      store.listActiveEffects()
    }
  }
}
