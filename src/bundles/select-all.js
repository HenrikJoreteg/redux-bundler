import { selectorNameToValueName } from '../utils'

export default {
  name: 'selectAll',
  init: (store) => {
    store.selectAll = () => {
      const selectorNames = Object.keys(store.meta.unboundSelectors).sort()
      return selectorNames.reduce((accum, key) => {
        accum[selectorNameToValueName(key)] = store[key]()
        return accum
      }, {})
    }
  }
}
