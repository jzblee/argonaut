// Argonaut - Random portion
// by Jason Lee

'use strict'

/* global vec3, getRotationMatrix */

const uniformRandTable = []
const gaussianRandTable = []

let uniformRandIndex = 0
let gaussianRandIndex = 0

function randomGaussian () {
  let u = 0; let v = 0
  while (u === 0) u = Math.random() // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random()
  let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  num = num / 10.0 + 0.5 // Translate to 0 -> 1
  if (num > 1 || num < 0) return randomGaussian() // resample between 0 and 1
  return num
}

// Create random number tables of fixed length to lower overhead
function initRandTables () {
  for (let i = 0; i < 5000; i++) {
    uniformRandTable.push(Math.random())
    gaussianRandTable.push(randomGaussian())
  }
}

initRandTables()

function getUniformRand () {
  const temp = uniformRandIndex
  uniformRandIndex = (uniformRandIndex === uniformRandTable.length - 1) ? 0 : uniformRandIndex + 1
  return uniformRandTable[temp]
}

function getGaussianRand () { // eslint-disable-line no-unused-vars
  const temp = gaussianRandIndex
  gaussianRandIndex = (gaussianRandIndex === gaussianRandTable.length - 1) ? 0 : gaussianRandIndex + 1
  return gaussianRandTable[temp]
}

// Generates 100 random vectors, convert them to lines
// that start at the origin and return an array of vertices
function generateUniformRandomVectorDemo (w, range) { // eslint-disable-line no-unused-vars
  const vtx = []
  for (let i = 0; i < 100; i++) {
    const y = getUniformRand() * 2 - 1
    const theta = getUniformRand() * 2 * Math.PI - Math.PI
    const r = Math.sqrt(1 - Math.pow(y, 2))
    const v = vec3.fromValues(r * Math.cos(theta), y, -r * Math.sin(theta))
    vtx.push(0)
    vtx.push(0)
    vtx.push(0)
    vtx.push(v[0] * 32)
    vtx.push(v[1] * 32)
    vtx.push(v[2] * 32)
  }
  return vtx
}

// Generates, from uniform distribution, a vector pointing
// in a random direction
function generateUniformRandomVector () { // eslint-disable-line no-unused-vars
  const y = getUniformRand() * 2 - 1
  const theta = getUniformRand() * 2 * Math.PI - Math.PI
  const r = Math.sqrt(1 - Math.pow(y, 2))
  const v = vec3.fromValues(r * Math.cos(theta), y, -r * Math.sin(theta))
  return v
}

// The range is the maximum angle at which a uniformly
// generated vector will deviate from w
function generateUniformRandomVectorInRange (w, range) { // eslint-disable-line no-unused-vars
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
  return v
}

// Unused, previously used for demonstrating line segments generated
// in random directions within a certain angle range
function generateUniformRandomVectorInRangeDemo (w, range) { // eslint-disable-line no-unused-vars
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
