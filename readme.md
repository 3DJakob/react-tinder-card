# React Tinder Card

A react component to make swipeable elements like in the app tinder.

## Demo
![](tinder.gif)

Try out the interactive demo <a href="https://3djakob.github.io/react-tinder-card-demo/">here.</a>

Check out the demo repo <a href="https://github.com/3DJakob/react-tinder-card-demo">here.</a>

## Installation

```sh
npm install --save react-tinder-card
```

## Usage

Import TinderCard and use the component like the snippet. Note that the component will not remove itself after swipe. If you want that behaviour implement that on the `onSwipe` callback. It is recommended to have `overflow: hidden` on your `#root` to prevent cards from being visible after they go of screen.

```js
import TinderCard from 'react-tinder-card'

// ...

const onSwipe = (direction) => {
  console.log('You swiped: ' + direction)
}

const onCardLeftScreen = (myIdentifier) => {
  console.log(myIdentifier + ' left the screen')
}

return (
  <TinderCard onSwipe={onSwipe} onCardLeftScreen={() => onCardLeftScreen('fooBar')}>Hello, World!</TinderCard>
)
```

## Options

### `flickOnSwipe`

- optional
- type: `boolean`
- default: `true`

Whether or not to let the element be flicked away off-screen after a swipe

### `onSwipe`

- requried
- type: `SwipeHandler`

Callback that will be executed when a swipe has been completed. It will be called with a single string denoting which direction the swipe was in: `'left'`, `'right'`, `'up'` or `'down'`

### `onCardLeftScreen`

- optional
- type: `SwipeHandler`

Callback that will be executed when a `TinderCard` has left the screen.