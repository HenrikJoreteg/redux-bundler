let debug = false
try { debug = !!window.localStorage.debug } catch (e) {}
export default debug

export const IS_BROWSER = typeof window !== 'undefined' || typeof self !== 'undefined'
export const IS_DEBUG = debug
