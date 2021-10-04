const React = require('react')
const { View, PanResponder, Dimensions } = require('react-native')
const { useSpring, animated } = require('react-spring/native')
const { height, width } = Dimensions.get('window')

const settings = {
  maxTilt: 25, // in deg
  rotationPower: 50,
  swipeThreshold: 1 // need to update this threshold for RN (1.5 seems reasonable...?)
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

const animateOut = async (gesture, setSpringTarget) => {
  const diagonal = pythagoras(height, width)
  const velocity = pythagoras(gesture.vx, gesture.vy)
  const finalX = diagonal * gesture.vx
  const finalY = diagonal * gesture.vy
  const finalRotation = gesture.vx * 45
  const duration = diagonal / velocity

  setSpringTarget({
    x: finalX,
    y: finalY,
    rot: finalRotation, // set final rotation value based on gesture.vx
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
  // TODO make async use onRest to know when returned
  // translate back to the initial position
  setSpringTarget({ x: 0, y: 0, rot: 0, config: physics.animateBack })
}

const getSwipeDirection = (speed) => {
  if (Math.abs(speed.x) > Math.abs(speed.y)) {
    return speed.x > 0 ? 'right' : 'left'
  } else {
    return speed.y > 0 ? 'down' : 'up'
  }
}

// must be created outside of the TinderCard forwardRef
const AnimatedView = animated(View)

const TinderCard = React.forwardRef(
  (
    { flickOnSwipe = true, children, onSwipe, onCardLeftScreen, className, preventSwipe = [] },
    ref
  ) => {
    const [{ x, y, rot }, setSpringTarget] = useSpring(() => ({
      x: 0,
      y: 0,
      rot: 0,
      config: physics.touchResponsive
    }))

    React.useImperativeHandle(ref, () => ({
      async swipe (dir = 'right') {
        if (onSwipe) onSwipe(dir)
        const power = 1.3
        const disturbance = (Math.random() - 0.5) / 2
        if (dir === 'right') {
          await animateOut({ vx: power, vy: disturbance }, setSpringTarget)
        } else if (dir === 'left') {
          await animateOut({ vx: -power, vy: disturbance }, setSpringTarget)
        } else if (dir === 'up') {
          await animateOut({ vx: disturbance, vy: power }, setSpringTarget)
        } else if (dir === 'down') {
          await animateOut({ vx: disturbance, vy: -power }, setSpringTarget)
        }
        if (onCardLeftScreen) onCardLeftScreen(dir)
      },
      async restoreCard () {
        await animateBack(() => setSpringTarget())
        // await animateBack(() => setSpringTarget({x: 0, y: 0, rot: 0, config: physics.touchResponsive, onRest: () => console.log('fooooobar')})) // Return when foobar is logged... How?
      }
    }))

    const handleSwipeReleased = React.useCallback(
      async (setSpringTarget, gesture) => {
        // Check if this is a swipe
        if (
          Math.abs(gesture.vx) > settings.swipeThreshold ||
          Math.abs(gesture.vy) > settings.swipeThreshold
        ) {
          const dir = getSwipeDirection({ x: gesture.vx, y: gesture.vy })

          if (flickOnSwipe) {
            if (!preventSwipe.includes(dir)) {
              if (onSwipe) onSwipe(dir)

              await animateOut(gesture, setSpringTarget)
              if (onCardLeftScreen) onCardLeftScreen(dir)
              return
            }
          }
        }

        // Card was not flicked away, animate back to start
        animateBack(setSpringTarget)
      },
      [flickOnSwipe, onSwipe, onCardLeftScreen, preventSwipe]
    )

    const panResponder = React.useMemo(
      () =>
        PanResponder.create({
          // Ask to be the responder:
          onStartShouldSetPanResponder: (evt, gestureState) => true,
          onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
          onMoveShouldSetPanResponder: (evt, gestureState) => true,
          onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

          onPanResponderGrant: (evt, gestureState) => {
            // The gesture has started.
            // Probably wont need this anymore as postion i relative to swipe!
            setSpringTarget({ x: gestureState.dx, y: gestureState.dy, rot: 0, config: physics.touchResponsive })
          },
          onPanResponderMove: (evt, gestureState) => {
            // use guestureState.vx / guestureState.vy for velocity calculations
            // translate element
            let rot = ((300 * gestureState.vx) / width) * 15// Magic number 300 different on different devices? Run on physical device!
            rot = Math.max(Math.min(rot, settings.maxTilt), -settings.maxTilt)
            setSpringTarget({ x: gestureState.dx, y: gestureState.dy, rot, config: physics.touchResponsive })
          },
          onPanResponderTerminationRequest: (evt, gestureState) => {
            return true
          },
          onPanResponderRelease: (evt, gestureState) => {
            // The user has released all touches while this view is the
            // responder. This typically means a gesture has succeeded
            // enable
            handleSwipeReleased(setSpringTarget, gestureState)
          }
        }),
      []
    )

    return (
      <AnimatedView
        {...panResponder.panHandlers}
        style={{
          transform: [
            { translateX: x },
            { translateY: y },
            { rotate: rot.interpolate((rot) => `${rot}deg`) }
          ]
        }}
      >
        {children}
      </AnimatedView>
    )
  }
)

module.exports = TinderCard
