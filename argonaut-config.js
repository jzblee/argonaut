// Argonaut - Config portion
// by Jason Lee

'use strict'

/* global glMatrix */
/* eslint-disable no-unused-vars */

const vec2 = glMatrix.vec2 // used for wind speed in 2D plane (easy config)
const vec3 = glMatrix.vec3
const mat4 = glMatrix.mat4
const quat = glMatrix.quat // used for quaternions and rotation
const mat3 = glMatrix.mat3 // used for quaternions and rotation

// Also need to change the viewport size in the HTML
const WIDTH = 512
const HEIGHT = 512

const EPSILON = 0.0005

const configSets = [
  {
    desc: { type: null, data: 'Bouncing ball' },
    particleConfigIndex: { type: 'int', data: 0 },
    simType: { type: 'string', data: 'bouncingball' },
    initialState: { type: 'object', data: {} }
  },
  {
    desc: { type: null, data: 'Falling cube' },
    particleConfigIndex: { type: 'int', data: 0 },
    simType: { type: 'string', data: 'rbd' },
    initialState: { type: 'object', data: {} }
  },
  {
    desc: { type: null, data: 'Orbiting particles' },
    particleConfigIndex: { type: 'int', data: 1 },
    simType: { type: 'string', data: 'particles' },
    initialState: { type: 'object', data: {} }
  },
  {
    desc: { type: null, data: 'Falling particles' },
    particleConfigIndex: { type: 'int', data: 2 },
    simType: { type: 'string', data: 'particles' },
    initialState: { type: 'object', data: {} }
  }
]

let configIndex = 0

const darkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches
