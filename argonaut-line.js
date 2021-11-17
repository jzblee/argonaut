// Argonaut - Line portion
// by Jason Lee

'use strict'

/* global Plane, vec3 */

// This part of the program is for displaying visualization lines,
// or for implementing simulation lines

// for example, a gravitational attractor may be an infinite
// line, or a finite line segment.

let lines = [] // eslint-disable-line prefer-const
// the particles portion may add lines here to serve
// as markers for particle attractor locations

// generates line and line segment vertices for display
function generateAllLineVertices (gl) { // eslint-disable-line no-unused-vars
  // generate bounding box (hardcoded to the orthographic view so far)
  const sceneBoundingBox = [ // eslint-disable-line no-unused-vars
    new Plane(vec3.fromValues(-gl.canvas.clientWidth / 16, 0, 0), vec3.fromValues(1, 0, 0)),
    new Plane(vec3.fromValues(gl.canvas.clientWidth / 16, 0, 0), vec3.fromValues(-1, 0, 0)),
    new Plane(vec3.fromValues(0, -gl.canvas.clientWidth / 16, 0), vec3.fromValues(0, 1, 0)),
    new Plane(vec3.fromValues(0, gl.canvas.clientWidth / 16, 0), vec3.fromValues(0, -1, 0)),
    new Plane(vec3.fromValues(0, 0, -gl.canvas.clientWidth / 16), vec3.fromValues(0, 0, 1)),
    new Plane(vec3.fromValues(0, 0, gl.canvas.clientWidth / 16), vec3.fromValues(0, 0, -1))
  ]
  const lineVertices = []
  lines.forEach(function (line) {
    if (line.isInfinite) {
      const direction = vec3.create()
      vec3.subtract(direction, line.p1, line.p0)
      vec3.normalize(direction, direction)
    } else {
      // just display the points
      // you can then cut them off at the bounding box later
      lineVertices.push(line.p0[0])
      lineVertices.push(line.p0[1])
      lineVertices.push(line.p0[2])
      lineVertices.push(line.p1[0])
      lineVertices.push(line.p1[1])
      lineVertices.push(line.p1[2])
    }
  })
  return lineVertices
}
