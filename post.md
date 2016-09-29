# redux bundles

**tl;dr: I've created a way to bundle up redux-related functionality to allow for re-use of application functionality independent of UI.**

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

So it gives you a way to create a state management system you could think of it as a self-contained, in-memory database. Dispatching actions is how you make "writes" to that "database".

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

By contrast we can do that work outside of our components keeping our components really small and presentational, and instead we can use selectors to contain that more complex logic. That way instead of using `connect()` to select large chunks of our state to pass in as properties to our component, we can be very specific in what we provide to our components.

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
export const selectGamesPlayed = createSelector(

)
export const selectUserIsPro = createSelector(
  selectIsLoggedIn,
  selectUserData,
  (isLoggedIn, userData) => isLoggedIn && userData.xp > 100
)
```

At first glance, these look pretty inefficient. But reselect will ensure that as long as the input functions are "shallow equal" the last result will be returned from a 1-level deep cache. It's function memoization but with only ever storing one cached result.

All this said, you end up with a function that takes the entire current "state" object from redux and returns a boolean answer to "is this a pro user or not".

Previously, any unrelated change to `userData` would make that component `render()`. But now, since we're being more specific, only changes in the result of *that* selector will be used to determine if it need to re-render. This is because now, `react-redux`'s `connect()` can create a more efficient `shouldComponentUpdate` method and make sure that the component never tries to re-render unless it's the end result will actually be different.

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

The value of this will be obvious if you've ever had to change the shape of the state inside of a large redux app written without selectors. For example, if in the above example, we change the way we determine if a user is `pro` or not, it only requires one change and won't break anything else or any other unit tests. Speaking of which…

## maintaining testability

If you have larger, more complex state that you're tracking and if you're doing a lot of the conditional logic inside your components it can be really arduous to re-create the entire state and have to stub out a whole fake DOM just to test whether your little state change broke something.

Selector functions created by `reselect` thanks to [a PR from yours truly](https://github.com/reactjs/reselect/pull/92) have a property called `.resultFunc` that is a reference to the final function you handed to reselect. As such, you can write unit tests for *just* the function that's unique without having to stub the entire state object. And, if your app logic lives in selectors rather than sprinkled throughout your components everywhere, it's a lot easier to reuse that logic. Odds are, you're going to use the information of whether the user is logged in, or whether they're a "pro" level user all throughout your app. There's no need to restate those determinations everywhere, just use the same selector!

It really helps "DRY" up your app and helps eliminate a lot of bugs due to surface area.

## making selectors first-class citizens

I see proper use of selectors as being a really key component in  building a manageable redux app.

But they're not without their challenges…

## so much boilerplate!

As applications grow, the boilerplate necessary to add new functionality can become a challenge.

Any time you want to add something new to your app, you find yourself creating one or more reducers, plus a slew of selectors, and action creators. This can become a bit unwieldy.

You also need direct references to them in your components. You need to import all the selectors/actionCreators that you want to connect to your components.

Also, this makes re-usability tough. Because if you want to write a set of re-usable code to share between two redux apps, you have to manually add all the various components needed to manage that piece of state.

Often these get sprinkled about into different files and/or folders. You may, for example, be keep a master list of action constants somewhere, etc. When really, the place where you know most about what your selectors need to be grabbing from your reducers are where you writing your reducers!

## We need something to pull it all together, but how!?

I think application development, in its ideal state, should feel like building legos. Neatly encapsulated "bricks" of functionality composed into something beautiful.

Many frameworks provide a set of bricks and an API to allow developers to add their own bricks. The enduring trend seems to be that we should be bundling things using the concept of a "component". This doesn't always quite cut it for me.

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

### So what about reusing everything that *isn't* UI code

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

### Decorating the redux store

Redux is very low-level so you end up with a lot of boilerplate.

A connected component sometimes starts looking like this:

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

### What if instead we attached everything to the redux store?

We've got this magical singular redux `store` object.

It's already passed everywhere by `<Provider>` via React's `context`.

**What if we just bound/and attached all our selectors and action creators too!**

We can `bindActionCreators` *once* and similarly we can bind selectors to `getState()` so we can just call `store.selectIsLoggedIn()` as a method on the store!

Then components can grab them from since the store is already passed via React's internal `context`.

It cuts down on the boilerplate quite a bit it we could simply grab them off of the store with a slightly smarter `connect()` function.

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

By using strings and a bit of convention `selectX` and `doX` we don't have to worry about direct references. This will make some people cringe, because its less explicit.

But, it's easy to make this code blow up. If the string referenced doesn't exist on the store, it can just throw an `Error` so it'll be super quick/easy to notice typos, and such. And all of a sudden you don't have to worry about importing/binding all those selectors and action creators at the top of your files. As we've learned recently [imports are not "free"](https://nolanlawson.com/2016/08/15/the-cost-of-small-modules/) in terms of performance.

### What do we have to do to make this fly?

As it turns out, this concept of decorating the redux store with new capabilities has been a bit of a gateway to *a lot* of simplifications.

First, it means that we have to make a wrapper for `createStore` that will take these selectors, reducers, and action creators from *somewhere* and compose them into a fully decorated "store" object.

It would be quite arduous to individually list and import *every single selector and action creator you're going to want in the file that creates you store. It breaks encapsulation and means we have to maintain this mapping anytime we change anything.

This is the perfect opportunity to create a way to "bundle" related functionality.

Then we can write a `createStore` function that takes a list of bundles… enter `redux-bundler`.


### dj-dj-dj-django!

Before I started writing JS fulltime (roughly when node.js came out) I was a Django developer. Django, for those who may not be familiar, is a Python-based application framework for creating dynamic server applications. Django has a concept they call [reusable django "apps"](https://docs.djangoproject.com/en/1.10/intro/reusable-apps/).

These are bundles of functionality, that may or may not have related UI, may or may not have related database models, may or may not have been included as part of "Django core".

Some of them require that others are also installed, but generally, they all play by the same rules and get composed into an application by being "installed" and listed, in a logical order, in the `settings.py` file. They're not infinitely nestable, they're not running in isolation from one another. They just add a set of functionality in a django-esque way to your app.

For this to work well, it obviously requires these to be structured a certain way. But it works quite well.

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
