// Argonaut - MatOps portion
// by Jason Lee

'use strict'

/* global vec3, mat4, getUniformRand */

// standard linear interpolation for each component of a vec3
/* eslint-disable no-unused-vars */
const simpleGLVec3MixFn = function (t, prevValue, nextValue) {
/* eslint-enable no-unused-vars */
  const interpolationX = (1.0 - t) * prevValue[0] + t * nextValue[0]
  const interpolationY = (1.0 - t) * prevValue[1] + t * nextValue[1]
  const interpolationZ = (1.0 - t) * prevValue[2] + t * nextValue[2]
  return vec3.fromValues(interpolationX, interpolationY, interpolationZ)
}

/*
  Creates a rotation matrix that will rotate given points such that the +Z axis of
  their coordinate frame matches the direction of the normal vector parameter
  supplied here.
*/
function getRotationMatrix (nI) {
  // choose some other vector to get cross products, to generate our other axes
  let linearlyIndependentVector = vec3.fromValues(1, 0, 0)
  if (nI[0] === 0 && nI[1] === 0 && nI[2] === 0) {
    console.error('ERROR: normal vector for triangle fan has length 0')
  } else if (nI[0] !== 0 && nI[1] === 0 && nI[2] === 0) {
    linearlyIndependentVector = vec3.fromValues(0, 1, 0)
  }

  // normalize nI, just in case it isn't already so
  // also give it a new name for consistency with the other axes (forthcoming)
  vec3.normalize(nI, nI)
  const newZAxis = nI

  // generate the new X axis by getting cross product of
  // linearlyIndependentVector with nI (the new Z axis)
  const newXAxis = vec3.create()
  vec3.cross(newXAxis, linearlyIndependentVector, nI)
  vec3.normalize(newXAxis, newXAxis)

  const newYAxis = vec3.create()
  vec3.cross(newYAxis, nI, newXAxis)
  vec3.normalize(newYAxis, newYAxis)

  // create a rotation matrix to rotate the disc into the coordinate frame given
  // by treating nI as the +Z direction
  const rotation = mat4.fromValues(
    newXAxis[0], newXAxis[1], newXAxis[2], 0.0,
    newYAxis[0], newYAxis[1], newYAxis[2], 0.0,
    newZAxis[0], newZAxis[1], newZAxis[2], 0.0,
    0.0, 0.0, 0.0, 1.0
  )

  return rotation
}

function calculateTriangleNormal (p0, p1, p2) { // eslint-disable-line no-unused-vars
  const v0 = vec3.create()
  const v1 = vec3.create()
  const nI = vec3.create()
  vec3.subtract(v0, p1, p0)
  vec3.subtract(v1, p2, p0)
  vec3.cross(nI, v0, v1)
  vec3.normalize(nI, nI)
  return nI
}

// Unused, previously used for demonstrating line segments generated
// in random directions within a certain angle range
/* eslint-disable no-unused-vars */
function generateUniformRandomVectorInRangeDemo (w, range) {
  /* eslint-enable no-unused-vars */
  const vtx = []
  for (let i = 0; i < 100; i++) {
    const f = getUniformRand()
    const phi = Math.sqrt(f) * range
    const theta = getUniformRand() * 2 * Math.PI - Math.PI
    const rotationMatrix = getRotationMatrix(w)

    const vPrime = vec3.fromValues(
      Math.cos(theta) * Math.sin(phi),
      Math.sin(theta) * Math.sin(phi),
      Math.cos(phi)
    )
    const v = vec3.create()
    vec3.transformMat4(v, vPrime, rotationMatrix)
    vtx.push(0)
    vtx.push(0)
    vtx.push(0)
    vtx.push(v[0] * 32)
    vtx.push(v[1] * 32)
    vtx.push(v[2] * 32)
  }
  return vtx
}
