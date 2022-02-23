// Argonaut - Dashboard portion
// by Jason Lee

'use strict'

/* global initialState, vec2, EPSILON, CustomEvent */

function getInitialWindDirection () {
  const original = initialState.windSpeed ? initialState.windSpeed : vec2.fromValues(0.0, 0.0)
  const length = vec2.length(original)
  let degrees = 0
  if (length > EPSILON) {
    degrees = Math.atan2(original[1], original[0]) * 180 / Math.PI - 90
    document.querySelector('#windDirectionValue').innerHTML = Math.round(degrees)
    document.querySelector('#windSpeedValue').innerHTML = Math.round(length)
    document.querySelector('#windDirection').value = Math.round(degrees)
    document.querySelector('#windSpeed').value = Math.round(length)
  } else {
    document.querySelector('#windDirectionValue').innerHTML = 0
    document.querySelector('#windSpeedValue').innerHTML = 0
    document.querySelector('#windDirection').value = 0
    document.querySelector('#windSpeed').value = 0
  }
}

getInitialWindDirection()

function setWindDirection () {
  const degrees = parseFloat(document.querySelector('#windDirection').value)

  document.querySelector('#windDirectionValue').innerHTML = Math.round(degrees)
}

function linkWindDirection () {
  const elem = document.querySelector('#windDirection')
  elem.oninput = setWindDirection
}
linkWindDirection()

function setWindSpeed () {
  const speed = parseFloat(document.querySelector('#windSpeed').value)

  document.querySelector('#windSpeedValue').innerHTML = Math.round(speed)
}

function linkWindSpeed () {
  const elem = document.querySelector('#windSpeed')
  elem.oninput = setWindSpeed
}
linkWindSpeed()

function confirmSettings () {
  let degrees = parseFloat(document.querySelector('#windDirection').value) + 90
  if (degrees > 180) degrees -= 360
  const speed = document.querySelector('#windSpeed').value
  const windSpeedX = speed * Math.cos(degrees * Math.PI / 180)
  const windSpeedY = speed * Math.sin(degrees * Math.PI / 180)

  document.querySelector('#c').dispatchEvent(
    new CustomEvent('confirmSettings', {
      detail: { windSpeedX: windSpeedX, windSpeedY: windSpeedY }, bubbles: true
    }))
}

function linkConfirmSettingsButton () {
  document.querySelector('#confirmSettings').onclick = confirmSettings
}

linkConfirmSettingsButton()
