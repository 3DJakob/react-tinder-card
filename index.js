const React = require('react')
const { useSpring, animated } = require('@react-spring/web')

const height = window.innerHeight
const width = window.innerWidth

const settings = {
  maxTilt: 25, // in deg
  rotationPower: 50,
  swipeThreshold: 0.5 // need to update this threshold for RN (1.5 seems reasonable...?)
}

// physical properties of the spring
const physics = {
  touchResponsive: {
    friction: 50,
    tension: 2000
  },
  animateOut: {
    friction: 30,
    tension: 400
  },
  animateBack: {
    friction: 10,
    tension: 200
  }
}

const pythagoras = (x, y) => {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
}

const normalize = (vector) => {
  const length = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2))
  return { x: vector.x / length, y: vector.y / length }
}

const animateOut = async (gesture, setSpringTarget) => {
  const diagonal = pythagoras(height, width)
  const velocity = pythagoras(gesture.x, gesture.y)
  const finalX = diagonal * gesture.x
  const finalY = diagonal * gesture.y
  const finalRotation = gesture.x * 45
  const duration = diagonal / velocity

  setSpringTarget.start({
    xyrot: [finalX, finalY, finalRotation],
    config: { duration: duration }
  })

  // for now animate back
  return await new Promise((resolve) =>
    setTimeout(() => {
      resolve()
    }, duration)
  )
}

const animateBack = (setSpringTarget) => {
  // translate back to the initial position
  return new Promise((resolve) => {
    setSpringTarget.start({ xyrot: [0, 0, 0], config: physics.animateBack, onRest: resolve })
  })
}

const getSwipeDirection = (property) => {
  if (Math.abs(property.x) > Math.abs(property.y)) {
    if (property.x > settings.swipeThreshold) {
      return 'right'
    } else if (property.x < -settings.swipeThreshold) {
      return 'left'
    }
  } else {
    if (property.y > settings.swipeThreshold) {
      return 'down'
    } else if (property.y < -settings.swipeThreshold) {
      return 'up'
    }
  }
  return 'none'
}

// must be created outside of the TinderCard forwardRef
const AnimatedDiv = animated.div

const TinderCard = React.forwardRef(
  (
    { flickOnSwipe = true, children, onSwipe, onCardLeftScreen, className, preventSwipe = [], swipeRequirementType = 'velocity', swipeThreshold = settings.swipeThreshold, onSwipeRequirementFulfilled, onSwipeRequirementUnfulfilled },
    ref
  ) => {
    const [{ xyrot }, setSpringTarget] = useSpring(() => ({
      xyrot: [0, 0, 0],
      config: physics.touchResponsive
    }))

    settings.swipeThreshold = swipeThreshold

    React.useImperativeHandle(ref, () => ({
      async swipe (dir = 'right') {
        if (onSwipe) onSwipe(dir)
        const power = 1.3
        const disturbance = (Math.random() - 0.5) / 2
        if (dir === 'right') {
          await animateOut({ x: power, y: disturbance }, setSpringTarget)
        } else if (dir === 'left') {
          await animateOut({ x: -power, y: disturbance }, setSpringTarget)
        } else if (dir === 'up') {
          await animateOut({ x: disturbance, y: power }, setSpringTarget)
        } else if (dir === 'down') {
          await animateOut({ x: disturbance, y: -power }, setSpringTarget)
        }
        if (onCardLeftScreen) onCardLeftScreen(dir)
      },
      async restoreCard () {
        await animateBack(setSpringTarget)
      }
    }))

    const handleSwipeReleased = React.useCallback(
      async (setSpringTarget, gesture) => {
        // Check if this is a swipe
        const dir = getSwipeDirection({
          x: swipeRequirementType === 'velocity' ? gesture.vx : gesture.dx,
          y: swipeRequirementType === 'velocity' ? gesture.vy : gesture.dy
        })

        if (dir !== 'none') {
          if (flickOnSwipe) {
            if (!preventSwipe.includes(dir)) {
              if (onSwipe) onSwipe(dir)

              await animateOut(swipeRequirementType === 'velocity' ? ({
                x: gesture.vx,
                y: gesture.vy
              }) : (
                normalize({ x: gesture.dx, y: gesture.dy }) // Normalize to avoid flicking the card away with super fast speed only direction is wanted here
              ), setSpringTarget, swipeRequirementType)
              if (onCardLeftScreen) onCardLeftScreen(dir)
              return
            }
          }
        }

        // Card was not flicked away, animate back to start
        animateBack(setSpringTarget)
      },
      [swipeRequirementType, flickOnSwipe, preventSwipe, onSwipe, onCardLeftScreen]
    )

    let swipeThresholdFulfilledDirection = 'none'

    const gestureStateFromWebEvent = (ev, startPositon, lastPosition, isTouch) => {
      let dx = isTouch ? ev.touches[0].clientX - startPositon.x : ev.clientX - startPositon.x
      let dy = isTouch ? ev.touches[0].clientY - startPositon.y : ev.clientY - startPositon.y

      // We cant calculate velocity from the first event
      if (startPositon.x === 0 && startPositon.y === 0) {
        dx = 0
        dy = 0
      }

      const vx = -(dx - lastPosition.dx) / (lastPosition.timeStamp - Date.now())
      const vy = -(dy - lastPosition.dy) / (lastPosition.timeStamp - Date.now())

      const gestureState = { dx, dy, vx, vy, timeStamp: Date.now() }
      return gestureState
    }

    React.useLayoutEffect(() => {
      let startPositon = { x: 0, y: 0 }
      let lastPosition = { dx: 0, dy: 0, vx: 0, vy: 0, timeStamp: Date.now() }
      let isClicking = false

      element.current.addEventListener(('touchstart'), (ev) => {
        if (!ev.srcElement.className.includes('pressable') && ev.cancelable) {
          ev.preventDefault()
        }

        const gestureState = gestureStateFromWebEvent(ev, startPositon, lastPosition, true)
        lastPosition = gestureState
        startPositon = { x: ev.touches[0].clientX, y: ev.touches[0].clientY }
      })

      element.current.addEventListener(('mousedown'), (ev) => {
        isClicking = true
        const gestureState = gestureStateFromWebEvent(ev, startPositon, lastPosition, false)
        lastPosition = gestureState
        startPositon = { x: ev.clientX, y: ev.clientY }
      })

      const handleMove = (gestureState) => {
        // Check fulfillment
        if (onSwipeRequirementFulfilled || onSwipeRequirementUnfulfilled) {
          const dir = getSwipeDirection({
            x: swipeRequirementType === 'velocity' ? gestureState.vx : gestureState.dx,
            y: swipeRequirementType === 'velocity' ? gestureState.vy : gestureState.dy
          })
          if (dir !== swipeThresholdFulfilledDirection) {
            swipeThresholdFulfilledDirection = dir
            if (swipeThresholdFulfilledDirection === 'none') {
              if (onSwipeRequirementUnfulfilled) onSwipeRequirementUnfulfilled()
            } else {
              if (onSwipeRequirementFulfilled) onSwipeRequirementFulfilled(dir)
            }
          }
        }

        // use guestureState.vx / guestureState.vy for velocity calculations
        // translate element
        let rot = gestureState.vx * 15 // Magic number 15 looks about right
        rot = Math.max(Math.min(rot, settings.maxTilt), -settings.maxTilt)
        setSpringTarget.start({ xyrot: [gestureState.dx, gestureState.dy, rot], config: physics.touchResponsive })
      }

      window.addEventListener(('mousemove'), (ev) => {
        if (!isClicking) return
        const gestureState = gestureStateFromWebEvent(ev, startPositon, lastPosition, false)
        lastPosition = gestureState
        handleMove(gestureState)
      })

      window.addEventListener(('mouseup'), (ev) => {
        if (!isClicking) return
        isClicking = false
        handleSwipeReleased(setSpringTarget, lastPosition)
        startPositon = { x: 0, y: 0 }
        lastPosition = { dx: 0, dy: 0, vx: 0, vy: 0, timeStamp: Date.now() }
      })

      element.current.addEventListener(('touchmove'), (ev) => {
        const gestureState = gestureStateFromWebEvent(ev, startPositon, lastPosition, true)
        lastPosition = gestureState
        handleMove(gestureState)
      })

      element.current.addEventListener(('touchend'), (ev) => {
        handleSwipeReleased(setSpringTarget, lastPosition)
        startPositon = { x: 0, y: 0 }
        lastPosition = { dx: 0, dy: 0, vx: 0, vy: 0, timeStamp: Date.now() }
      })
    })

    const element = React.useRef()

    return (
      React.createElement(AnimatedDiv, {
        ref: element,
        className,
        style: {
          transform: xyrot.to((x, y, rot) => `translate3d(${x}px, ${y}px, ${0}px) rotate(${rot}deg)`)
        },
        children
      })
    )
  }
)

module.exports = TinderCard
