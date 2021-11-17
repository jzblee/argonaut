// Argonaut - Config portion
// by Jason Lee

'use strict'

/* global glMatrix */
/* eslint-disable no-unused-vars */

const vec2 = glMatrix.vec2 // used for wind speed in 2D plane (easy config)
const vec3 = glMatrix.vec3
const mat4 = glMatrix.mat4

// Also need to change the viewport size in the HTML
const WIDTH = 512
const HEIGHT = 512

const EPSILON = 0.0002

const configSets = [
  {
    desc: { type: null, data: 'Orbiting particles' },
    particleConfigIndex: { type: 'int', data: 0 },
    simType: { type: 'string', data: 'particles' },
    initialState: { type: 'object', data: {} }
  },
  {
    desc: { type: null, data: 'Falling particles' },
    particleConfigIndex: { type: 'int', data: 1 },
    simType: { type: 'string', data: 'none' },
    initialState: { type: 'object', data: {} }
  }
]
