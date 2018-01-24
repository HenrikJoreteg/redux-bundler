import { h } from 'preact'
import NavHelper from 'preact-nav-helper'
import { connect } from 'redux-bundler-preact'

const Layout = ({doUpdateUrl, currentComponent, pathname}) => {
  const navItems = [
    {url: '/', label: 'Home'},
    {url: '/people', label: 'StarWars People'},
    {url: '/people/1', label: 'Luke Skywalker Detail Page'}
  ]

  const Page = currentComponent
  return (
    <NavHelper onInternalNav={doUpdateUrl}>
      <main class='ph3 ph4-ns pt3 bt b--black-10 black-60'>
        <nav class='pa3 pa4-ns'>
          <p class='b f3 tc f2-ns black-70 lh-solid mb0'>redux-bundler demo</p>
          <p class='f6 db b tc pb2'>By: <a href='https://twitter.com/henrikjoreteg' class='link blue dim'>@HenrikJoreteg</a></p>
          <div class='tc pb3'>
            {navItems.map(item => {
              return (
                <a class={`link dim gray f6 f5-ns dib pa2 mr3 ${item.url === pathname ? 'bg-lightest-blue' : ''}`} href={item.url}>{item.label}</a>
              )
            })}
          </div>
        </nav>
        <Page />
        <div class='mv5'>
          <a href='https://github.com/henrikjoreteg/redux-bundle' class='f6 dib pr2 mid-gray dim'>redux-bundler on github</a>
          <a href='https://github.com/henrikjoreteg/redux-bundler/tree/master/examples/reactive-data-fetching' class='f6 dib pl2 mid-gray dim'>source for this app</a>
        </div>
      </main>
    </NavHelper>
  )
}

export default connect(
  'selectCurrentComponent',
  'selectPathname',
  'doUpdateUrl',
  Layout
)
