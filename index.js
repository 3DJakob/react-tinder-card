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

const getElementComputedStyle = (element) => {
  const elementStyles = window.getComputedStyle(element)
  const widthString = elementStyles.getPropertyValue('width')
  const width = Number(widthString.split('px')[0])
  const heightString = elementStyles.getPropertyValue('height')
  const height = Number(heightString.split('px')[0])
  const paddingTopString = elementStyles.getPropertyValue('padding-top')
  const paddingTop = Number(paddingTopString.split('px')[0])
  const paddingBottomString = elementStyles.getPropertyValue('padding-bottom')
  const paddingBottom = Number(paddingBottomString.split('px')[0])
  const paddingRightString = elementStyles.getPropertyValue('padding-right')
  const paddingRight = Number(paddingRightString.split('px')[0])
  const paddingLeftString = elementStyles.getPropertyValue('padding-left')
  const paddingLeft = Number(paddingLeftString.split('px')[0])
  return {
    x: width,
    y: height,
    paddingTop,
    paddingBottom,
    paddingRight,
    paddingLeft
  }
}

const pythagoras = (x, y) => {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
}

const animateOut = async (element, speed, easeIn = false, disableRotationOnAnimateOutAndBack = false) => {
  const startPos = getTranslate(element)
  const bodySize = getElementSize(document.body)
  const diagonal = pythagoras(bodySize.x, bodySize.y)

  const velocity = pythagoras(speed.x, speed.y)
  const time = diagonal / velocity
  const multiplier = diagonal / velocity

  const translateString = translationString(speed.x * multiplier + startPos.x, -speed.y * multiplier + startPos.y)
  let rotateString = ''

  const rotationPower = 200

  if (easeIn) {
    element.style.transition = 'ease ' + time + 's'
  } else {
    element.style.transition = 'ease-out ' + time + 's'
  }

  if (!disableRotationOnAnimateOutAndBack) {
    if (getRotation(element) === 0) {
      rotateString = rotationString((Math.random() - 0.5) * rotationPower)
    } else if (getRotation(element) > 0) {
      rotateString = rotationString((Math.random()) * rotationPower / 2 + getRotation(element))
    } else {
      rotateString = rotationString((Math.random() - 1) * rotationPower / 2 + getRotation(element))
    }
  }

  element.style.transform = translateString + rotateString

  await sleep(time * 1000)
}

const animateBack = (element, dragTransitionDuration, disableRotationOnAnimateOutAndBack) => {
  element.style.transition = settings.snapBackDuration + 'ms'
  const startingPoint = getTranslate(element)
  const translation = translationString(startingPoint.x * -settings.bouncePower, startingPoint.y * -settings.bouncePower)
  if (disableRotationOnAnimateOutAndBack) {
    element.style.transform = translation
  } else {
    const rotation = rotationString(getRotation(element) * -settings.bouncePower)
    element.style.transform = translation + rotation
  }

  setTimeout(() => {
    element.style.transform = 'none'
  }, settings.snapBackDuration * 0.75)

  setTimeout(() => {
    element.style.transition = dragTransitionDuration
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

const dragableTouchmove = (coordinates, element, offset, lastLocation, disableDragRotation) => {
  const pos = { x: coordinates.x + offset.x, y: coordinates.y + offset.y }
  const newLocation = { x: pos.x, y: pos.y, time: new Date().getTime() }
  const translation = translationString(pos.x, pos.y)
  let rotation = ''
  if (!disableDragRotation) {
    const rotCalc = calcSpeed(lastLocation, newLocation).x / 1000
    rotation = rotationString(rotCalc * settings.maxTilt)
  }
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

const getHiddenSettings = (element) => {
  const bodySize = getElementComputedStyle(document.body)

  let elementSize = { x: 0, y: 0 }
  if (element) {
    elementSize = getElementSize(element)
  }

  return {
    display: 'none',
    transform: 'translate(' + (bodySize.x + bodySize.paddingRight + elementSize.x) + 'px, 0px)',
    transition: settings.snapBackDuration + 'ms'
  }
}

const TinderCard = React.forwardRef((
  {
    flickOnSwipe = true,
    children,
    onSwipe,
    onCardLeftScreen,
    className,
    preventSwipe = [],
    disableDragRotation,
    dragTransitionDuration = '10ms',
    hidden,
    disableRotationOnAnimateOutAndBack
  },
  ref
) => {
  const swipeAlreadyReleased = React.useRef(false)

  const element = React.useRef()

  React.useImperativeHandle(ref, () => ({
    async swipe (dir = 'right') {
      if (onSwipe) onSwipe(dir)
      const power = 1000
      const disturbance = (Math.random() - 0.5) * 100
      if (dir === 'right') {
        await animateOut(element.current, { x: power, y: disturbance }, true, disableRotationOnAnimateOutAndBack)
      } else if (dir === 'left') {
        await animateOut(element.current, { x: -power, y: disturbance }, true, disableRotationOnAnimateOutAndBack)
      } else if (dir === 'up') {
        await animateOut(element.current, { x: disturbance, y: power }, true, disableRotationOnAnimateOutAndBack)
      } else if (dir === 'down') {
        await animateOut(element.current, { x: disturbance, y: -power }, true, disableRotationOnAnimateOutAndBack)
      }
      element.current.style.display = 'none'
      if (onCardLeftScreen) onCardLeftScreen(dir)
    },
    restoreCard () {
      element.current.style.display = 'block'
      animateBack(element.current, dragTransitionDuration, disableRotationOnAnimateOutAndBack)
    },
    hideCard () {
      const hiddenSettings = getHiddenSettings()
      element.current.style.display = hiddenSettings.display
      element.current.style.transform = hiddenSettings.transform
      element.current.style.transition = hiddenSettings.transition
    }
  }))

  const handleSwipeReleased = React.useCallback(async (element, speed) => {
    if (swipeAlreadyReleased.current) { return }
    swipeAlreadyReleased.current = true

    // Check if this is a swipe
    if (Math.abs(speed.x) > settings.swipeThreshold || Math.abs(speed.y) > settings.swipeThreshold) {
      const dir = getSwipeDirection(speed)

      if (onSwipe) onSwipe(dir)

      if (flickOnSwipe) {
        if (!preventSwipe.includes(dir)) {
          await animateOut(element, speed, undefined, disableRotationOnAnimateOutAndBack)
          element.style.display = 'none'
          if (onCardLeftScreen) onCardLeftScreen(dir)
          return
        }
      }
    }

    // Card was not flicked away, animate back to start
    animateBack(element, dragTransitionDuration, disableRotationOnAnimateOutAndBack)
  }, [swipeAlreadyReleased, flickOnSwipe, onSwipe, onCardLeftScreen, preventSwipe])

  const handleSwipeStart = React.useCallback(() => {
    swipeAlreadyReleased.current = false
  }, [swipeAlreadyReleased])

  React.useLayoutEffect(() => {
    let offset = { x: null, y: null }
    let speed = { x: 0, y: 0 }
    let lastLocation = { x: 0, y: 0, time: new Date().getTime() }
    let mouseIsClicked = false

    element.current.addEventListener(('touchstart'), (ev) => {
      ev.preventDefault()
      handleSwipeStart()
      offset = { x: -touchCoordinatesFromEvent(ev).x, y: -touchCoordinatesFromEvent(ev).y }
    })

    element.current.addEventListener(('mousedown'), (ev) => {
      ev.preventDefault()
      mouseIsClicked = true
      handleSwipeStart()
      offset = { x: -mouseCoordinatesFromEvent(ev).x, y: -mouseCoordinatesFromEvent(ev).y }
    })

    element.current.addEventListener(('touchmove'), (ev) => {
      ev.preventDefault()
      const newLocation = dragableTouchmove(
        touchCoordinatesFromEvent(ev),
        element.current,
        offset,
        lastLocation,
        disableDragRotation
      )
      speed = calcSpeed(lastLocation, newLocation)
      lastLocation = newLocation
    })

    element.current.addEventListener(('mousemove'), (ev) => {
      ev.preventDefault()
      if (mouseIsClicked) {
        const newLocation = dragableTouchmove(
          mouseCoordinatesFromEvent(ev),
          element.current,
          offset,
          lastLocation,
          disableDragRotation
        )
        speed = calcSpeed(lastLocation, newLocation)
        lastLocation = newLocation
      }
    })

    element.current.addEventListener(('touchend'), (ev) => {
      ev.preventDefault()
      handleSwipeReleased(element.current, speed)
      speed = { x: 0, y: 0 }
    })

    element.current.addEventListener(('mouseup'), (ev) => {
      if (mouseIsClicked) {
        ev.preventDefault()
        mouseIsClicked = false
        handleSwipeReleased(element.current, speed)
        speed = { x: 0, y: 0 }
      }
    })

    element.current.addEventListener(('mouseleave'), (ev) => {
      if (mouseIsClicked) {
        ev.preventDefault()
        mouseIsClicked = false
        handleSwipeReleased(element.current, speed)
        speed = { x: 0, y: 0 }
      }
    })

    if (hidden) {
      const hiddenSettings = getHiddenSettings()
      element.current.style.display = hiddenSettings.display
      element.current.style.transform = hiddenSettings.transform
      element.current.style.transition = hiddenSettings.transition
    }
  }, [])

  return (
    React.createElement('div', { ref: element, className }, children)
  )
})

module.exports = TinderCard
