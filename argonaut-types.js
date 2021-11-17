// Argonaut - Types portion
// by Jason Lee

'use strict'

/* global vec3 */
/* eslint-disable no-unused-vars */

/*
 * I lifted several object schemas from the types class and simplified
 * them for this first exercise
 */
function Sphere (position, velocity, acceleration, radius) {
  this.position = position
  this.velocity = velocity
  this.acceleration = acceleration
  this.radius = radius
}

function Plane (pI, nI) {
  this.pI = pI
  this.nI = nI
}

function Line (p0, p1, isInfinite) {
  this.p0 = p0
  this.p1 = p1
  this.isInfinite = isInfinite
}

function PointAttractor (point, mass, power) {
  this.point = point
  this.mass = mass
  this.power = power
}

function LineAttractor (line, mass, power) {
  this.line = line
  this.mass = mass
  this.power = power
}

function Triangle (p0, p1, p2) {
  this.p0 = p0
  this.p1 = p1
  this.p2 = p2
  this.nI = vec3.create()
  const v0 = vec3.create()
  const v1 = vec3.create()
  vec3.subtract(v0, p1, p0)
  vec3.subtract(v1, p2, p0)
  vec3.cross(this.nI, v0, v1)
  vec3.normalize(this.nI, this.nI)
  this.center = vec3.create()
  vec3.add(this.center, this.center, this.p0)
  vec3.add(this.center, this.center, this.p1)
  vec3.add(this.center, this.center, this.p2)
  vec3.scale(this.center, this.center, 1 / 3)
};
