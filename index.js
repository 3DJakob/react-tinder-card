/* global WebKitCSSMatrix */

const React = require('react')
const sleep = require('p-sleep')

const settings = {
  snapBackDuration: 300,
  maxTilt: 5,
  bouncePower: 0.2,
  swipeThreshold: 300 // px/s
}

const getElementSize = (element) => {
  const elementStyles = window.getComputedStyle(element)
  const widthString = elementStyles.getPropertyValue('width')
  const width = Number(widthString.split('px')[0])
  const heightString = elementStyles.getPropertyValue('height')
  const height = Number(heightString.split('px')[0])
  return { x: width, y: height }
}

const pythagoras = (x, y) => {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
}

const animateOut = async (element, speed) => {
  const startPos = getTranslate(element)
  const bodySize = getElementSize(document.body)
  const diagonal = pythagoras(bodySize.x, bodySize.y)

  const velocity = pythagoras(speed.x, speed.y)
  const time = diagonal / velocity
  const multiplier = diagonal / velocity

  const translateString = translationString(speed.x * multiplier + startPos.x, -speed.y * multiplier + startPos.y)
  const rotateString = rotationString(getRotation(element))

  element.style.transition = 'ease-out ' + time + 's'
  element.style.transform = translateString + rotateString

  await sleep(time * 1000)
}

const animateBack = (element) => {
  element.style.transition = settings.snapBackDuration + 'ms'
  const startingPoint = getTranslate(element)
  const translation = translationString(startingPoint.x * -settings.bouncePower, startingPoint.y * -settings.bouncePower)
  const rotation = rotationString(getRotation(element) * -settings.bouncePower)
  element.style.transform = translation + rotation

  setTimeout(() => {
    element.style.transform = 'none'
  }, settings.snapBackDuration * 0.75)

  setTimeout(() => {
    element.style.transition = '10ms'
  }, settings.snapBackDuration)
}

const getSwipeDirection = (speed) => {
  if (Math.abs(speed.x) > Math.abs(speed.y)) {
    return (speed.x > 0) ? 'right' : 'left'
  } else {
    return (speed.y > 0) ? 'up' : 'down'
  }
}

const calcSpeed = (oldLocation, newLocation) => {
  const dx = newLocation.x - oldLocation.x
  const dy = oldLocation.y - newLocation.y
  const dt = (newLocation.time - oldLocation.time) / 1000
  return { x: dx / dt, y: dy / dt }
}

const translationString = (x, y) => {
  const translation = 'translate(' + x + 'px, ' + y + 'px)'
  return translation
}

const rotationString = (rot) => {
  const rotation = 'rotate(' + rot + 'deg)'
  return rotation
}

const getTranslate = (element) => {
  const style = window.getComputedStyle(element)
  const matrix = new WebKitCSSMatrix(style.webkitTransform)
  const ans = { x: matrix.m41, y: matrix.m42 }
  return ans
}

const getRotation = (element) => {
  const style = window.getComputedStyle(element)
  const matrix = new WebKitCSSMatrix(style.webkitTransform)
  const ans = -Math.asin(matrix.m21) / (2 * Math.PI) * 360
  return ans
}

const dragableTouchmove = (coordinates, element, offset, lastLocation) => {
  const pos = { x: coordinates.x + offset.x, y: coordinates.y + offset.y }
  const newLocation = { x: pos.x, y: pos.y, time: new Date().getTime() }
  const translation = translationString(pos.x, pos.y)
  const rotCalc = calcSpeed(lastLocation, newLocation).x / 1000
  const rotation = rotationString(rotCalc * settings.maxTilt)
  element.style.transform = translation + rotation
  return newLocation
}

const touchCoordinatesFromEvent = (e) => {
  const touchLocation = e.targetTouches[0]
  return { x: touchLocation.clientX, y: touchLocation.clientY }
}

const mouseCoordinatesFromEvent = (e) => {
  return { x: e.clientX, y: e.clientY }
}

const TinderCard = ({ flickOnSwipe = true, children, onSwipe, onCardLeftScreen, className, preventSwipe = [] }) => {
  const state = React.useRef({
    lastLocation: { x: 0, y: 0, time: Date.now() },
    mouseIsClicked: false,
    offset: { x: null, y: null },
    speed: { x: 0, y: 0 },
    swipeAlreadyReleased: false,
  })

  const handleSwipeReleased = React.useCallback(async (element) => {
    if (state.current.swipeAlreadyReleased) return
    state.current.swipeAlreadyReleased = true

    const { speed } = state.current

    // Check if this is a swipe
    if (Math.abs(speed.x) > settings.swipeThreshold || Math.abs(speed.y) > settings.swipeThreshold) {
      const dir = getSwipeDirection(speed)

      if (onSwipe) onSwipe(dir)

      if (flickOnSwipe) {
        if (!preventSwipe.includes(dir)) {
          await animateOut(element, speed)
          element.style.display = 'none'
          if (onCardLeftScreen) onCardLeftScreen(dir)
          return
        }
      }
    }

    // Card was not flicked away, animate back to start
    animateBack(element)
  }, [state, flickOnSwipe, onSwipe, onCardLeftScreen, preventSwipe])

  const onTouchStart = React.useCallback((ev) => {
    ev.preventDefault()
    state.current.swipeAlreadyReleased = false
    state.current.offset = { x: -touchCoordinatesFromEvent(ev).x, y: -touchCoordinatesFromEvent(ev).y }
  }, [state])

  const onMouseDown = React.useCallback((ev) => {
    ev.preventDefault()
    state.current.mouseIsClicked = true
    state.current.swipeAlreadyReleased = false
    state.current.offset = { x: -mouseCoordinatesFromEvent(ev).x, y: -mouseCoordinatesFromEvent(ev).y }
  }, [state])

  const onTouchMove = React.useCallback((ev) => {
    ev.preventDefault()
    const { offset, lastLocation } = state.current
    const newLocation = dragableTouchmove(touchCoordinatesFromEvent(ev), ev.currentTarget, offset, lastLocation)
    state.current.speed = calcSpeed(lastLocation, newLocation)
    state.current.lastLocation = newLocation
  }, [state])

  const onMouseMove = React.useCallback((ev) => {
    ev.preventDefault()
    if (state.current.mouseIsClicked) {
      const { offset, lastLocation } = state.current
      const newLocation = dragableTouchmove(mouseCoordinatesFromEvent(ev), ev.currentTarget, offset, lastLocation)
      state.current.speed = calcSpeed(lastLocation, newLocation)
      state.current.lastLocation = newLocation
    }
  }, [state])

  const onTouchEnd = React.useCallback((ev) => {
    ev.preventDefault()
    handleSwipeReleased(ev.currentTarget)
  }, [handleSwipeReleased])

  const onMouseUp = React.useCallback((ev) => {
    if (state.current.mouseIsClicked) {
      ev.preventDefault()
      state.current.mouseIsClicked = true
      handleSwipeReleased(ev.currentTarget)
    }
  }, [state, handleSwipeReleased])

  const onMouseLeave = React.useCallback((ev) => {
    if (state.current.mouseIsClicked) {
      ev.preventDefault()
      state.current.mouseIsClicked = true
      handleSwipeReleased(ev.currentTarget)
    }
  }, [state, handleSwipeReleased])

  return React.createElement('div', {
    className,
    onMouseDown,
    onMouseLeave,
    onMouseMove,
    onMouseUp,
    onTouchEnd,
    onTouchMove,
    onTouchStart
  }, children)
}

module.exports = TinderCard
