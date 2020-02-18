import React from 'react'

declare type Direction = 'left' | 'right' | 'up' | 'down'
declare type SwipeHandler = (direction: Direction) => void

declare interface Props {
  /**
   * Whether or not to let the element be flicked away off-screen after a swipe
   *
   * @default true
   */
  flickOnSwipe?: boolean

  /**
   * Callback that will be executed when a swipe has been completed
   */
  onSwipe: SwipeHandler

  /**
   * An array of directions for which to prevent swiping out of screen. Valid arguments are 'left', 'right', 'up' and 'down'.
   *
   * @default []
   */
  preventSwipe?: [String]
}

declare const TinderCard: React.FC<Props>

export = TinderCard
