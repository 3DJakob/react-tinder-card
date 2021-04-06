# React Tinder Card

A react component to make swipeable elements like in the app tinder.

## Compatibility
- React
- React Native

The import and api is identical for both Web and Native.

## Demo
![](tinder.gif)

Try out the interactive demo <a href="https://3djakob.github.io/react-tinder-card-demo/">here.</a>

Check out the Web demo repo <a href="https://github.com/3DJakob/react-tinder-card-demo">here.</a>

Check out the Native demo repo <a href="https://github.com/3DJakob/react-native-tinder-card-demo">here.</a>

## Installation

```sh
npm install --save react-tinder-card
```

## Usage

Import TinderCard and use the component like the snippet. Note that the component will not remove itself after swipe. If you want that behaviour implement that on the `onCardLeftScreen` callback. It is recommended to have `overflow: hidden` on your `#root` to prevent cards from being visible after they go of screen.

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
  <TinderCard onSwipe={onSwipe} onCardLeftScreen={() => onCardLeftScreen('fooBar')} preventSwipe={['right', 'left']}>Hello, World!</TinderCard>
)
```

If you want more usage help check out the demo repository code: [Web](https://github.com/3DJakob/react-tinder-card-demo/tree/master/src/examples) / [Native](https://github.com/3DJakob/react-native-tinder-card-demo/tree/master/src/examples)

The simple example is the minimum code needed to get you started.

The advanced example implements a state to dynamically remove swiped elements as well as using buttons to trigger swipes.

Both Web code examples can be tested on the [demo page.](https://3djakob.github.io/react-tinder-card-demo/) The Native code examples can be cloned and runned using `expo start`.

## Props

### `flickOnSwipe`

- optional
- type: `boolean`
- default: `true`

Whether or not to let the element be flicked away off-screen after a swipe.

### `onSwipe`

- optional
- type: `SwipeHandler`

Callback that will be executed when a swipe has been completed. It will be called with a single string denoting which direction the swipe was in: `'left'`, `'right'`, `'up'` or `'down'`.

### `onCardLeftScreen`

- optional
- type: `CardLeftScreenHandler`

Callback that will be executed when a `TinderCard` has left the screen. It will be called with a single string denoting which direction the swipe was in: `'left'`, `'right'`, `'up'` or `'down'`.

### `preventSwipe`

- optional
- type: `Array<string>`
- default: `[]`

An array of directions for which to prevent swiping out of screen. Valid arguments are `'left'`, `'right'`, `'up'` and `'down'`.

## API

### `swipe([dir])`

- `dir` (`Direction`, optional) - The direction in which the card should be swiped. One of: `'left'`, `'right'`, `'up'` and `'down'`.
- returns `Promise<void>`

Programmatically trigger a swipe of the card in one of the valid directions `'left'`, `'right'`, `'up'` and `'down'`. This function, `swipe`, can be called on a reference of the TinderCard instance. Check the [example](https://github.com/3DJakob/react-tinder-card-demo/blob/master/src/examples/Advanced.js) code for more details on how to use this.
