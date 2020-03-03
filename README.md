# redux-bundler

Compose a Redux store out of smaller bundles of functionality.

Created for and used by PWAs that value small bundle sizes, network resilience, and explicit state management. If you want to be able to declaratively combine seemingly disparate logic such as: if it's the third tuesday of the month, our cached data is more than 3.5 days old, and the user is viewing the `/reposition-satellite` page then trigger a data refresh of satellite position... this toolkit is for you.

If you pair it with [Preact](https://preactjs.com/) it's ~15kb for an entire app toolkit.

If you want to see an app built with it, check out: [anesthesiacharting.com](https://anesthesiacharting.com).

See docs site here: https://reduxbundler.com
