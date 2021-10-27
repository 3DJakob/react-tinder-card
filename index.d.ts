import React from 'react'

declare type Direction = 'left' | 'right' | 'up' | 'down'
declare type SwipeHandler = (direction: Direction) => void
declare type CardLeftScreenHandler = (direction: Direction) => void

declare interface API {
  /**
   * Programmatically trigger a swipe of the card in one of the valid directions `'left'`, `'right'`, `'up'` and `'down'`. This function, `swipe`, can be called on a reference of the TinderCard instance. Check the [example](https://github.com/3DJakob/react-tinder-card-demo/blob/master/src/examples/Advanced.js) code for more details on how to use this.
   *
   * @param dir The direction in which the card should be swiped. One of: `'left'`, `'right'`, `'up'` and `'down'`.
   */
  swipe(dir?: Direction): Promise<void>
  
  /**
   * Restore swiped-card state. Use this function if you want to undo a swiped-card (e.g. you have a back button that shows last swiped card or you have a reset button. The promise is resolved once the card is returned
   */
   restoreCard (): Promise<void>
}

declare interface Props {
  ref?: React.Ref<API>

  /**
   * Whether or not to let the element be flicked away off-screen after a swipe.
   *
   * @default true
   */
  flickOnSwipe?: boolean

  /**
   * Callback that will be executed when a swipe has been completed. It will be called with a single string denoting which direction the swipe was in: `'left'`, `'right'`, `'up'` or `'down'`.
   */
  onSwipe?: SwipeHandler

  /**
   * Callback that will be executed when a `TinderCard` has left the screen. It will be called with a single string denoting which direction the swipe was in: `'left'`, `'right'`, `'up'` or `'down'`.
   */
  onCardLeftScreen?: CardLeftScreenHandler

  /**
   * An array of directions for which to prevent swiping out of screen. Valid arguments are `'left'`, `'right'`, `'up'` and `'down'`.
   *
   * @default []
   */
  preventSwipe?: string[]

  /**
   * What method to evaluate what direction to throw the card on release. 'velocity' will evaluate direction based on the direction of the swiping movement. 'position' will evaluate direction based on the position the card has on the screen like in the app tinder.
   * If set to position it is recommended to manually set swipeThreshold based on the screen size as not all devices will accommodate the default distance of 300px and the default native swipeThreshold is 1.5px which most likely is undesirably low.
   * 
   * @default 'velocity'
   */
   swipeRequirementType?: 'velocity' | 'position'

   /**
   * The threshold of which to accept swipes. If swipeRequirementType is set to velocity it is the velocity threshold and if set to position it is the position threshold.
   * On native the default value is 1 as the physics works differently there.
   * If swipeRequirementType is set to position it is recommended to set this based on the screen width so cards can be swiped on all screen sizes.
   * 
   * @default 300
   */
    swipeThreshold?: number

  /**
   * HTML attribute class
   */
  className?: string
}

declare const TinderCard: React.FC<Props>

export = TinderCard
