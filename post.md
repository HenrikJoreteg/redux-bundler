# redux bundles

**tl;dr: I've created a way to bundle up redux-related functionality to allow re-use of application functionality independent of UI. I've released it as [redux-bundle](https://www.npmjs.com/package/redux-bundler) on npm. It is in no way tied to react, nor does it assume a browser environment, oh and it packs and bundles a bunch of functionality into ~12kb.**

I <3 redux. It is, in my opinion, the most elegant state management system in the JS-world right now. It's tiny (2kb), minimalist, extensible, and very well-documented.

If you're building a simple, synchronous TODO list app, it's a dream come true.

*But* therein lies the challenge: most of us are not building TODO apps.

Please let me be very clear: This is not a criticism of Redux or its creators. In fact, quite the contrary, great libraries are best used as foundations and building blocks which is what I'm going to explain my approaches to doing here.

## redux is beautifully incomplete

Intentionally, redux does *very* little and this is how it should be.

But as a low-level abstraction it leaves a lot up to the application developer. This is where many get lost.

Since the beginning Dan Abramov's been saying that he expects tools and frameworks to be written on top of redux because there are gaps.

## So, what are the gaps?

Redux provides a way to dispatch actions which are plain JS objects with a `type` property and these actions will result in changes to a shared `state` object that contains all the shared state for your apps.

You could think of it as a self-contained, in-memory database. Dispatching actions is how you make "writes" to that "database".

But in databases "writes" are only half the story, what about "reads"?

This is where the concept of `selectors` comes into play. In my opinion, selectors are the most underrated pattern in redux apps. However, this isn't surprising since redux largely leaves this up to the user to solve.

## What are "selectors"?

If you're using redux you're *already writing selectors* whether you realize it or not. Selectors are the functions used to extract the piece of the state your component actually cares about. If using `react-redux`, it's the argument you pass to `connect()`:

```js
import { connect } from 'react-redux'

const Component = ({userData}) => {
  const showProUserMessage =
    userData.token && userData.xp > 100

  return (
    <div>
      {showProUserMessage && (
        <div>Hi there, you pro, you!</div>
      )}
    </div>
  )
)

// THIS IS A SELECTOR!
const select = (state) => ({
  userData: state.userData
})

export default connect(select)(Component)
```

In the case above the `select` function just grabs the relevant portion of the state.

But, in real apps, often times we have much more complex information we're trying to derive from the current state.

One way to think about this is asking questions of our state. Some of these more complex types of questions might be:

- Should we consider the data we have cached to be stale?
- Do we need to prompt the user about using nearing their storage quota?
- Do we need to re-authenticate this user soon.
- Have we shown this newly minted "pro" user their welcome message?

These sorts of questions are often computed within components through a series of `if` / `then` statements in various component lifecycle methods. However, that approach often needlessly couples that logic to a component.

By contrast we can do that work outside of our components keeping our components really small and presentational, and instead we can use selectors to contain that more complex logic. Then, instead of using `connect()`, to select large chunks of our state to pass in as properties to our component, we can be very specific in what we provide to our components.

Selectors don't have to be anything other than a pure function that takes the state as an argument and returns some piece of information. But, we can make them smarter. The [reselect](https://github.com/reactjs/reselect) library lets us create selector functions that take advantage of redux's immutability principles. This lets us create "smart" selectors that won't re-compute unless its inputs have changed. Additionally, we can compose these functions to re-use logic. In this way we can break down complex "questions" we want to ask of our state such as "should I fetch more data". Into many smaller selectors that we compose to answer those larger questions.

As a quick example:

```js
import { createSelector } from 'reselect'

// we start with the basic "grab" function
const selectUserData = state => state.userData

// then we can build on that simple function
const selectUserLoggedIn = createSelector(
  // the plain function from above
  selectUserData,
  // whatever the last function you pass to
  // `createSelector` gets the result of all
  // the previous selectors as its arguments
  (userData) =>
    // let's assume if they have a token, they're logged in
    // so if `token` is truth this will return `true` and
    // `false` otherwise.
    return !!userData.token
  }
)
```

Expanding on this a bit, using some ES6 shorthands, and dropping the comments you can see these can be quite short, written quickly and combined to express increasingly complex logic without making a big mess or losing readability:

```js
export const selectUserData = state => state.userData
export const selectIsLoggedIn = createSelector(
  selectUserData,
  userData => !!userData.token
)
export const selectUserIsPro = createSelector(
  selectIsLoggedIn,
  selectUserData,
  (isLoggedIn, userData) => isLoggedIn && userData.xp > 100
)
```

Now we can use `selectUserIsPro` logic anywhere in components or other selectors that may care about it, without ever repeating that logic.

## Isn't that inefficient?

At first glance, these do look pretty inefficient. But reselect will ensure that as long as the input functions are "shallow equal" the last result will be returned from a 1-level deep cache. It's function memoization but with only ever storing one cached result. So, as it turns out it's pretty darn quick. Not to mention, this is all in pure JS nothing here is touching the DOM and redux's immutability approaches keep unnecessary re-computation to a minimum.

All this said, you end up with a function that takes the entire current "state" object from redux and returns a boolean answer to "is this a pro user or not".

The efficiency gains come down the line. Previously, any unrelated change to `userData` would make that component `render()`. But now only if a user changes "pro" status in the app, will it run the component's `render()`. This is because now, `react-redux`'s `connect()` can create a more efficient `shouldComponentUpdate` method.

Not to mention, it's a lot more readable and obvious what the data requirements are for a given component now:

```js
import { connect } from 'react-redux'
import { selectUserIsPro } from './selectors'

const Component = ({userIsPro}) => (
  <div>
    { userIsPro && (
      <div>Hi there, you pro, you!</div>
    ) }
  </div>
)

// now our selector function uses the other selector!
const select = (state) => ({
  userIsPro: selectUserIsPro(state)
})

export default connect(select)(Component)
```

## maintaining flexibility

Another reason the selector patterns above are so useful is they allow us to decouple the "reads" of data from the actual structure of the data.

The value of this will be obvious if you've ever had to change the shape of the state inside of a large redux app written without selectors. If in the above example, business rules change, and we need to change how we determine if a user is `pro` or not, it only requires changing that single selector function. No components or unrelated unit tests should break. Speaking of which…

## maintaining testability

If you have larger, more complex state that you're tracking and if you're doing a lot of the conditional logic inside your components it can be really arduous to re-create the entire state and have to stub out a whole fake DOM just to test whether your little state change broke something.

Because of a [PR I submitted](https://github.com/reactjs/reselect/pull/92) selector functions created by `reselect` also attach the last function you passed to `createSelector()` as `.resultFunc`. So, when writing tests, you don't need to stub out all the state needed by all the input selectors in order to test yours. In this way you can easily writing unit tests for *just* the function that's unique, makes your tests way less brittle when the state changes shape.

## surface area for bugs

If more of your app logic lives in selectors rather than sprinkled throughout your components everywhere, you can have great test coverage of your application logic without a bunch of mocking and stubbing, instead you're just writing unit tests for pure functions.

It really couldn't get much easier because you don't even need a browser-like environment to test them you can just run then in node.

And now, it's a lot easier to reuse that logic. When you first refactor an app to use selectors you'll likely find at least some duplication of pieces of this logic. Selectors give you a way of extracting, consolidating, and writing isolated unit tests for your app. There's no need to restate those determinations everywhere, just use the same selector!

Less surface area; less bugs.

## making selectors first-class citizens

I see proper use of selectors as being a really key component in  building a manageable redux app.

But they're not without their challenges…

## so much boilerplate!

As applications grow if all your state is retrieved via selectors, and all your state changes are defined by "action creator" functions pretty soon there's a ton of stuff you need to import an "wire up" to a component.

Any time you want to add something new to your app, you find yourself creating one or more reducers as well as some selectors, and action creators. This can become a bit unwieldy. You also need to explicitly import all the selectors/actionCreators that you want to connect to your components.

Also, this makes re-usability tough. Because if you want to write a set of re-usable code to share between two redux apps, you have to manually add all the various components needed to manage that piece of state.

Often these get sprinkled about into different files and/or folders. You may, for example, be keep a master list of action constants somewhere, etc. When really, the place where you know most about what your selectors need to be grabbing from your reducers are where you writing your reducers!

## I wanted something to pull it all together, but what!?

I think application development, in its ideal state, should feel like building legos. Neatly encapsulated "bricks" of functionality composed into something beautiful.

Many frameworks provide a set of these "bricks" and some mechanism to allow developers to add their own bricks. The enduring trend seems to be that we should be bundling things using the concept of a "component". From my experience this sounds better in theory than it actually is in practice.

The problem *I* seem to always run into when trying to create these re-usable pieces is that I want *the functionality* to be re-usable, not so much the UI. In fact, I want to be able to re-use functionality completely irrespective of the UI technology I use to render things. So using the concept of a UI component as a means of describing a bundle of functionality has never felt right. For example the reasoning behind wanting to use a [custom element to perform an ajax request](https://github.com/polymerelements/iron-ajax) escapes me.

I mean, what if I decide to switch to [WebWorker powered rendering](https://github.com/HenrikJoreteg/feather-app) or a 3kb alternative to the 42kb react lib? Projects like [preact](https://github.com/developit/preact), [virtual-dom](https://github.com/Matt-Esch/virtual-dom), and [snabbdom](https://github.com/snabbdom/snabbdom) are very intriguing to me. Especially once your app logic no longer lives in your components it's easier to experiment with alternate UI solutions. As I've written before, I'm far more interested in the ideas React popularized than React itself.

So for me, I'm not interested in permanently tying my entire application logic into a UI framework.

Sure, I'm happy to use React as a view layer especially since stateless functional components have come along and let me write views that look like this:

```js
export default ({ name }) => (
  <div>{ name }</div>
)
```

I mean, come on, that's beautiful! I don't know if you could get much simpler than that. In case you're wondering, you can even skip the `React` import [if you're clever](https://github.com/vslinko/babel-plugin-react-require).

I also like how JSX can be used with other libs too, so if my components look like that, it's not impossible to swap out React.

### So how can I go about reusing everything that *isn't* UI code

The problem of a re-usable date picker: solved. Just grab your favorite React component, Web component, Angular Component, Ember Component, jQuery plugin, etc, etc.

**But what about re-usable "functionality" that isn't a UI widget?**

- What about bundling up code that knows how to do initiate OAuth redirects and token retrieval against your auth system?
- What about routing?
- What about reusing logic that lets us retrieve, store, and observe the status of user geolocation as retrieved by `navigator.geolocation.getCurrentPosition`?

These things are simply *not* components. No matter how much we pretend they are, representing behavior as "elements" has always felt awkward to me.

The typical answer is to "write a generic library".

But, who cares?! I don't need a library to call `navigator.geolocation.getCurrentPosition()` for me, what I need is a way to *integrate* that information usefully into my application logic! I need something that I can add to give my app the capability of knowing about, asking for, and observing changes to the user's geolocation!

I want to be able to add a geolocation *thing* that seamlessly adds those capabilities into my apps!

Ideally, whatever that thing is, should be *a tiny little piece of code*!

In short, I want the Geolocation Lego Piece™.

### What might that piece look like?

A set of data to store (a reducer):
- successfully retrieved coordinates and data
- a flag to indicate whether the request for geolocation was rejected by the user
- metadata about when i last asked, whether it was successful, etc.

A set of actions I can initiate (action creators):
- doRequestGeolocation

A set of questions I can ask (selectors):
- Did this get rejected permanently?
- Do we know the user's coordinates
- What are the users's coordinates
- How old is the geolocation data we do have
- based on my "staleness tolerance" should we ask the user again?

Additionally, we may want a way to react to certain states to trigger effects:
- If we have coordinates, and users permission to get coordinates, and it makes sense to automatically dispatch `doAskGeolocation` again, right?

After doing this repeatedly, I've settled on something that feels like a good API for this kind of thing.

```js

const reducer = () => { ... }

const doRequestGeolocation = (dispatch) => {
  // assuming we've got a little promise-based geolocation lib
  dispatch({type: 'GEOLOCATION_START'})
  getGeolocation()
    .then(payload => {
      dispatch({type: 'GEOLOCATION_SUCCESS', payload})
    })
    .then(error => {
      dispatch({type: 'GEOLOCATION_ERROR', error})
    })
}

const selectCoordinates = createSelector( ... )

// we export something of a bundle
// aka Lego Brick ;)
export default {
  name: 'geolocation',
  reducer,
  doRequestGeolocation,
  selectCoordinates
}
```

Using a bit of convention we can now consume that bundle to compose a complete redux store!

`create-store.js`

```js
import { composeBundles } from 'redux-bundler'
import { geolocationBundle } from './bundles/geolocation'

export default composeBundles(geolocationBundle, otherBundle, yetAnother)
```

### Getting all decorative!

In the previous example, we'd iterate through the bundles and attempt to extract things based on convention.

If you've worked with redux you'd probably guess that the `composeBundles` function would need to extract all the `reducer` properties from each bundle and use redux's `combineReducers` to lump them together. But it may not be clear what to do with selectors and such.

Well when you hand a root reducer that you created with `combineReducers` to redux you're essentially folding the reducer functionality *into* the resulting redux store, right?

So what if we did the same with selectors and action creators?

We're already combining state, and state changes into a single store, why not also combine selectors and action creators?

Additionally, any time we want to use an `actionCreator` it has to be "bound" to the store anyway. WHy not just bind 'em all and attach them all up front and attach them to the store instance as properties?

Also, if we write all of our selectors to expect the full state object as an argument, we could do the same for them. Pre-bind them to `store.getState()` and attach them as properties to the store. Then we can just call `store.selectIsLoggedIn()` as a method on the store and get the result based on current state!

## Henrik you're nuts, you'll make a mess of the store instance!

Perhaps, it sounds pretty messy, but with a bit of convention I find it quite manageable and as it turns out, makes a lot of other things *less* messy. Exhibit A:

Because Redux is very low-level, you easily end up with a lot of boilerplate.

For example, a connected component sometimes starts looking like this:

```js
import {
  someSelector,
  someOtherSelector,
  evenMoreSelect,
  dataAllTheThingsExclamationPointSelector,
  ...
  ...
  ...
} from '../../selectors'
import {
  doSomething,
  doSomethingElse
} from '../../actions'

const MyComponent () => (
  <div>
    ...
  </div>
)

const select = state => {
  some: someSelector(state),
  someOther: someOtherSelector(state),
  evenMore: evenMoreSelect(state),
  data: dataAllTheThingsExclamationPointSelector(state),
  ...
  ...
  ...
}

export default connect(select, {doSomething, doSomethingElse})(MyComponent)
```

But, we've got this magical, singular redux `store` object that's already made available to all components using `<Provider>` and React's mystical `context` feature.

So, if we write a slightly smarter `connect()` function we can now grab what we need from the store by by string reference. Then, if we sprinkle in a bit of convention (note the naming convention of `doX`/`selectX`) things clean up pretty well:

```js
// name is irrelevant
import smarterConnect from 'magical-lib'

// Names of props derived from selector string
// by convention start all selector names with
// `select` so `selectSomething` would inject
// a prop called `something`
// Start all action creators with `doX` inject those as is.
// We need to distinguish between them because we need to be able to run the selectors to determine
// if the component needs to be re-rendered or not
const Component = ({something, somethingElse, otherThing, doSomething, doSomethingElse}) => (
  <div>
    ...
  </div>
)

export default smarterConnect(
  'selectSomething',
  'selectSomethingElse',
  'selectOtherThing',
  'doSomething',
  'doSomethingElse'
)(Component)
```

By using strings and a bit of convention `selectX` and `doX` we don't have to worry about maintaining direct references. This will make some people cringe, because its less explicit, but it makes me happy, because several of the typical problems associated with this lack of explicitness can be addressed fairly easily. If the strings don't exist on the store, we can just throw an `Error`!

So it's still quick/easy to notice typos and such. And all of a sudden you don't have to worry about importing/binding all those selectors and action creators at the top of your files. This has some additional perf benefits because as we've learned recently having [lots of imports is not "free"](https://nolanlawson.com/2016/08/15/the-cost-of-small-modules/). Plus, you no longer have to maintain all those import paths if you restructure your app code.

### Pulling it all together?

As it turns out, this concept of decorating the redux store really only makes sense when combined with the bundle/lego brick idea.

If we had to individually list and import *every single* selector, action creator, and reducer into a single `create-store.js` file it'd be ridiculously long and maintenance would be terrible. Avoiding this kind of crap is why we have the concept of encapsulation in computer science.

So, surprise, surprise, I wrote a thing that implements all this stuff I'm discussing: [redux-bundler](https://www.npmjs.com/package/redux-bundler).

### But Henrik, you suck at maintenance! I'm not using your lib!

Unpaid maintenance? Yes. I'm terrible at that. This is not news:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">I suck at OSS maintenance. If it works for my needs and you&#39;re not paying me to make it work for yours why rob my family of my time?</p>&mdash; Henrik Joreteg (@HenrikJoreteg) <a href="https://twitter.com/HenrikJoreteg/status/779199985099255808">September 23, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

You might assume that this is a thing that I'm trying to "market" to you and try to get you to use. Because many posts of this nature are just that, but Err... nope. I'm just sharing work and ideas I've found useful.

Use at your own risk, the ideas here are much more interesting than my implementation, IMO.

## Giving credit where credit is due...

**dj-dj-dj-django**! Before I started writing JS full time (roughly when node.js came out) I was a Django developer. Django, for those who may not be familiar, is a Python-based application framework for creating dynamic server applications. Django has a concept they call ["reusable django apps"](https://docs.djangoproject.com/en/1.10/intro/reusable-apps/).

These are essentially bundles of functionality, that may or may not have related UI, may or may not have related database models, may or may not have been included as part of "Django core".

Some of them require that others are also installed, but generally, they all play by the same rules and get composed into an application by being "installed" a.k.a. listed in a logical order, in the `settings.py` file. They're not infinitely nestable and composeable, they're not running in isolation from one another. They just add a set of functionality in a django-esque way to your app.

For this to work it obviously requires these to be structured a certain way "conventions". It's an API based on conventions. Some people scoff at this, but conventions are ridiculously powerful [in reducing complexity, ehem!](https://github.com/facebookincubator/create-react-app). But this type of bundling where you compose all these functionality chunks into a flat app, is something I've missed since those days because it works so well, while still being simple to grok.

**Starbucks** I've been working on a contract basis with Starbucks, through Formidable, over the last half year. Two great organizations, btw. The Formidable folks, myself included have been brought in by Starbucks to help them re-platform their web experience, moving to Node.js and React. It's been a blast so far.

The basic idea of this type of bundling was definitely born from my work there. I was asked to solve the problem of trying to re-use a bunch of functionality we've written for one app (including UI components) as a part of another app. In that work we've primarily focused on re-using large complete chunks of useable UI and all the underlying functionality. These "sub apps" as we call them also help manage merged market-specific configuration, declare routing, handle Internationalization messages, and share a UI shell. We then do all this composition in a "shell" that comes pre-built with a bunch of stuff we know we're going to want to do, like SSR, etc. So it does a lot more than bundle up a few reducers and selectors. But the ideas born of that effort that made me want to see how far I can push the stripped-down version of that same concept. I started spending nights and and weekends hacking on this idea for my own projects outside of the Starbucks work.

Interestingly, some of the ideas shared here are now seeping back into the Starbucks code where applicable.

As a side note, if you have any interest in joining that team to work on a truly global platform being rebuilt with node/react/redux. Ping [David Brunell]() or [Zac Smith]() they're interested in building a diverse, friendly, team of experts to re-invent their tech infrastructure. If you hurry, I might even get to onboard you to the codebase.

## Back to the tech...

### How big is it!?

The whole thing with a couple of external deps, *including* redux, a route matcher, the URL/routing modules, it weighs in at 10kbs min+gzip total.

1. redux itself
2. a very slightly tweaked redux-thunk (it changes how the recently added `withExtraArgs` stuff works).
3. the bundle composition code
4. A declarative local caching solution (backed by indexed-db, works in iOS9+ and Android), with TTL mechanism to load from cache first.
5. a url bundle
6. a helper for generating your routing bundle
7. an "effects" handling system based on observing state and lazily dispatching with `requestIdleCallback()` (includes shim for this)
8. a leave-in-able debugging module that will tell you:
  - what bundles are installed
  - what effects are being triggered based on current state
  - what the result of all known selectors are at each iteration (only in debug mode)
  - it also exposes all action creators, selectors, and the store itself to `window` so you can easily trigger things from the JS console.
9. An async-count bundle so you can `store.selectAsyncActive()` to see if there are any asynchronous actions happening. This could easily be modified to be able to take a callback or return a promise when all async actions have completed (useful for SSR?).
10. A `createAsyncResourceBundle` helper for generating cache aware bundles for remote data that you want to keep up-to-date.
11. A configurable geolocation bundle (built on `createAsyncResourceBundle`) for requesting, keeping up-to-date user geolocation from the browser.

That size includes all of those things and their dependencies.

For comparison React and React-DOM weigh in at about 43kb min+gzip (prod build). React-Router weighs about 12kb.

If you pair redux-bundler with [Preact](https://preactjs.com/) you're only at about 12kb total. This is closer to where I feel we need to be for library/FW code. I've talked about the importance of size for performance reasons [several](https://www.youtube.com/watch?v=okk0BGV9oY0) [times](https://joreteg.com/blog/viability-of-js-frameworks-on-mobile).

### Routing

Lots of folks using React and redux also use React-Router. Because you need something for routing and RR is kind of the unofficial default. Trick is, [as others have stated](https://formidable.com/blog/2016/07/11/let-the-url-do-the-talking-part-1-the-pain-of-react-router-in-redux/) RR and redux are conceptually at odds. I'll likely catch some heat for saying that, but both want to "own" routing state. Improvements to RR in version 4 look interesting in that it sounds like it's possible to pretend that redux owns it, even though it really doesn't. So, perhaps it's a solved problem. Ryan Florence had this to say:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/tptee">@tptee</a> heh, I wasn&#39;t clear: you will think it&#39;s controlled. I had to do crazy hacks to make it so, but you will get what you want.</p>&mdash; Ryan Florence (@ryanflorence) <a href="https://twitter.com/ryanflorence/status/775880867403091968">September 14, 2016</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>f

Regardless, I've personally always felt that RR was more than I needed. I don't want URL state to be *special* in any way. I prefer to keep url state in redux, bind it to the browser history and use some listeners to keep them in sync. With this approach we can just update the URL any time redux says it's different than it actually is in the browser, and vice versa (yes you can still have full control over replace/push with this approach). On window `popstate` we update redux with what the browser says the URL is. In this way, we have a single source of truth in redux. Then we can derive what components need to be shown via selectors, you can even derive how to transition between urls changes, (we do this at Starbucks).

But, at the core of that is some functionality that stores a url and lets us update it, replace it, replace just some query params, replace a hash value, etc. These are all available as action creators and selectors of a minimal [url bundle](). Additionally, it's entirely string-based so all ties to actual browser history are optional (works on server-too).

Anyway, adding the `urlBundle` gives your store this ability out of the box.

Personally, once going all in on this approach I'm not going back.

### Whooptie doo, neat trick Henrik! But, we need smarter routing with params and such.

Ok, I do too! Add the url bundle first, then use `createRouteBundle()` a 7 line function that returns a bundle that incorporates a small route matching lib and will add a `selectCurrentComponent` selector based on the routes you configure it with.

It ends up looking like this:

```js
import { createRouteBundle } from 'redux-bundler'
// these are components, but could be any object
import Login from '../components/pages/login'
import NotFound from '../components/pages/not-found'
import Dashboard from '../components/pages/dashboard'
import Detail from '../components/pages/detail'

export default createRouteBundle({
  '/': Login,
  '/dashboard': Dashboard,
  '/item/:itemId': Detail,
  '*': NotFound
})
```

Once you compose the resulting bundle into a store with `composeBundles` you end up with a `store.selectCurrentComponent()` that gives you the component to show based on the current url. Additionally, you have `store.selectRouteParams()` that gives you back an object with any named params the current route may have defined.

## Effects

Eventually folks building with redux seem to discover a problem that they can't figure out how to do with basic redux.

Smarter folks than I have invented lots of mechanisms to deal with this "side-effect" problem. If you think *this* post is long, [try reading this github thread on side-effects in redux](https://github.com/reactjs/redux/issues/1528).

The problem can be poorly summarized as: "I have this action that causes other actions... sometimes, maybe. And maybe it causes some other things to happen. Well, at least on Thursdays if you're in the Bermuda Triangle. But, only sometimes!"

This is a tough problem, as evidenced by the sheer length of that thread and by the lack of a clear "winner" in how to go about this.

Many people find the simple `redux-thunk` patterns insufficient... but I friggin' love that pattern. It's *so* simple. The various side effect solutions feel so "tacked-on". For example [redux-saga](https://github.com/yelouafi/redux-saga) relies on generators (and therefore requires that to be polyfilled) and [redux-loop](https://github.com/redux-loop/redux-loop) requires you return effects along with state changes in your reducers. Plus, for my little brain they both just feel excessively fancy.

So, I wondered if we couldn't somehow solve this problems with the tools we already have:

1. We can observe the store with `.subscribe()` that's what `connect()` does, for you.
2. We can compose simple questions into complex questions to ask of our state with selectors.
3. We can dispatch other needed changes with actionCreators.

So maybe we could register a single listener on the store, then after each action run a set of selectors on it to figure out what actions we need to dispatch as a result?

So really you end up with these pairs of selectors and corresponding actions.

If the selector returns something other than `null`, that means it needs to dispatch the corresponding action.

Additionally, in order to allow "smarter" dispatching whatever non-null value that is returned from the selector will be passed to the action creator. In this way you can have a `selectItemIdsToFetch` selector that passes either `null` or an array of ids to `doFetchItems()` action creator.

So if you're using the `effects` bundle, it will extract any `effects` properties from other bundles and make sure they're included in these reactive checks.

## But, aren't there issues with that? Double dispatches and such?

Yup, there are subtle challenges.

First, you don't necessary want to dispatch several actions at once. Because doing so will cause a decent amount of code to run. Any relevant selectors will be re-ran and likely several component `render` methods will be called, and this will generally happen synchronously. If the user is mid-scroll, you don't necessarily want to run a bunch of potentially render-blocking JS, that may cause poor scrolling a.k.a. "jank". The effect bundle handles this by always dispatching on a `requestIdleCallback` if available, it falls back to `setTimeout` to at least get it out of the same call stack.

Secondly, if you fail to indicate in your state that you are currently trying to fetch something you'll keep dispatching over and over. And, since as discussed in the previous paragraph, we were so clever as to use `requestIdleCallback` it never stack overflows. So you just get an infinitely scrolling debug console and everlasting, but not enough to explode, code execution. These are tricky to debug. But 99% of the time you've got a selector returning something other than `null` because it's failing to track that something is currently in progress.

But when it works, this is an *incredibly resilient* approach to data fetching. 

### Can we do the same with redux?

Yup. Redux does this to some extent already, you compose several reducers into a single root reducer function when you `createStore()` but it's only part of the answer.

If I want to write a npm module that adds user geolocation to an app, exporting a reducer function isn't enough. What all do we need?

1. A reducer function
2. Some action constants
  1.  `GEOLOCATE_START`
  2.  `GEOLOCATE_SUCCESS`
  3.  `GEOLOCATE_ERROR`
3. An action creator
  1. `doRequestGeolocation`
2. A few selector functions
  1. `selectGeolocation()`
  2. `selectIsLoading()`
  3. `selectHasFailed()`

Looking at that list, only some of those things are part of its external API. The reducer and the action constants are implementation details. The only thing the rest of our code cares about is being able to ask questions of our store about the current state, and be able to dispatch a `doRequestGeolocation()` when we want to.

Beyond that, it's all implementation details.

What I want is a better `createStore` that takes more than just a root reducer. I want this:

```js
import { composeBundles } from 'redux-bundler'
import userGeolocationBundle from './bundles/geolocation'
import authBundle from './bundles/auth'

const store = composeBundles(
  userGeolocation,
  authBundle,
  inspectBundle
)


```


So what if we defined a bundle like this:


```js
const GEOLOCATE_START = 'GEOLOCATE_START'
const GEOLOCATE_ERROR = 'GEOLOCATE_ERROR'
const GEOLOCATE_SUCCESS = 'GEOLOCATE_SUCCESS'

export default {
  name: 'geolocation',
  reducer: (state = {}, action) => {
    if (action.type === GEOLOCATE_START) {

    }

    return state
  }
}

```
