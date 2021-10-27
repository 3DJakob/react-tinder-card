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
  // translate back to the initial position
  return new Promise((resolve) => {
    setSpringTarget({ x: 0, y: 0, rot: 0, config: physics.animateBack, onRest: resolve })
  })
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
    { flickOnSwipe = true, children, onSwipe, onCardLeftScreen, className, preventSwipe = [], swipeRequirementType = 'velocity', swipeThreshold = settings.swipeThreshold },
    ref
  ) => {
    const [{ x, y, rot }, setSpringTarget] = useSpring(() => ({
      x: 0,
      y: 0,
      rot: 0,
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
        const passesSwipeRequirement = (
          Math.abs(swipeRequirementType === 'velocity' ? gesture.vx : gesture.dx) > settings.swipeThreshold ||
          Math.abs(swipeRequirementType === 'velocity' ? gesture.vy : gesture.dy) > settings.swipeThreshold
        )
        if (passesSwipeRequirement) {
          console.log('passed!!')
          const dir = getSwipeDirection({
            x: swipeRequirementType === 'velocity' ? gesture.vx : gesture.dx,
            y: swipeRequirementType === 'velocity' ? gesture.vy : gesture.dy
          })

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
        className={className}
      >
        {children}
      </AnimatedView>
    )
  }
)

module.exports = TinderCard
