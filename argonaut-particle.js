// Argonaut - Particle portion
// by Jason Lee

'use strict'

/* global PointAttractor, vec3, lines, Line, generateUniformRandomVector
generateUniformRandomVectorInRange, getUniformRand,
initialState, EPSILON */

const numParticles = 5000

const particles = []
const inactiveStack = []
let inactiveCount = numParticles

const particleConfigs = [
  {
    pointAttractors: [],
    mass: 1.0,
    airResistanceCoeff: 0.05,
    lifespan: 0.01,
    spawnDir: vec3.fromValues(0.0, 1.0, 0.0),
    gravity: vec3.fromValues(0.0, 0.0, 0.0)
  },
  {
    pointAttractors: [
      new PointAttractor(vec3.fromValues(0, 3, 0), 4e11, 2)
    ],
    mass: 0.1,
    airResistanceCoeff: 0.05,
    lifespan: 20,
    spawnDir: vec3.fromValues(-0.07, 0.1, 0.0),
    gravity: vec3.fromValues(0.0, 0.0, 0.0)
  },
  {
    pointAttractors: [],
    mass: 1.0,
    airResistanceCoeff: 0.5,
    lifespan: 0,
    spawnDir: null,
    gravity: vec3.fromValues(0.0, -9.81, 0.0)
  }
]

let particleConfigIndex = 0 // eslint-disable-line prefer-const

function generatePattCrosses () { // eslint-disable-line no-unused-vars
  particleConfigs[particleConfigIndex].pointAttractors.forEach(function (pAtt) {
    const point = pAtt.point
    const size = 0.5
    lines.push(new Line(vec3.fromValues(point[0] - size, point[1] - size, 0), vec3.fromValues(point[0] + size, point[1] + size, 0), false))
    lines.push(new Line(vec3.fromValues(point[0] - size, point[1] + size, 0), vec3.fromValues(point[0] + size, point[1] - size, 0), false))
  })
}

// create a new particle with default parameters
function createParticle () {
  return {
    active: false,
    position: vec3.create(),
    velocity: vec3.create(),
    acceleration: vec3.create(),
    initialcolor: vec3.create(),
    lifespan: particleConfigs[particleConfigIndex].lifespan,
    birth: 0,
    mass: particleConfigs[particleConfigIndex].mass,
    airResistanceCoeff: particleConfigs[particleConfigIndex].airResistanceCoeff
  }
}

// generate a particle list with a number of default particles
function plGenerate () {
  for (let i = 0; i < numParticles; i++) {
    particles[i] = createParticle()
    inactiveStack[i] = numParticles - i - 1
  }
}

plGenerate()

// make all particles inactive
function plClear () { // eslint-disable-line no-unused-vars
  for (let i = 0; i < numParticles; i++) {
    particles[i].active = false
    inactiveStack[i] = numParticles - i - 1
  }
  inactiveCount = numParticles
}

// test each particle to see if it should be made inactive
function plTestAndDeactivate (t) { // eslint-disable-line no-unused-vars
  for (let i = 0; i < numParticles; i++) {
    if (particles[i].active && t > (particles[i].lifespan + particles[i].birth)) {
      particles[i].active = false
      pushInactiveStack(i)
    }
  }
}

function pushInactiveStack (particleIndex) {
  // just to be sure, force particle to be inactive
  particles[particleIndex].active = false
  inactiveStack[inactiveCount] = particleIndex
  inactiveCount++
}

function popInactiveStack () {
  if (inactiveCount === 0) {
    return -1
  }
  inactiveCount--
  const temp = inactiveStack[inactiveCount]
  particles[temp].active = true
  inactiveStack[inactiveCount] = -1
  return temp
}

// generate particles, from the hardcoded generator position, and
// a random direction for velocity and a random lifespan between 1
// and 3 seconds. As particles approach the ends of their lifespans,
// they fade out
// NOTE: for orbiting example, the lifespan is fixed at 20 seconds
// to show full particle path
function generateParticles (t, h, f) { // eslint-disable-line no-unused-vars
  const r = 100 // for now, do 100 as the particle rate
  let n = Math.floor(r * h)
  // f = f + (r * h - n);  // this would come into play with particle rollover
  f = 0
  for (let i = 0; i < n; i++) {
    const newParticleIndex = popInactiveStack()
    const nP = particles[newParticleIndex]
    nP.position = vec3.fromValues(0, 0, 0)
    nP.velocity = generateUniformRandomVector()
    // if a spawnDir exists, replace the uniform random velocity with a restricted range
    if (particleConfigs[particleConfigIndex].spawnDir) { // spawn the particles going in one direction
      nP.velocity = generateUniformRandomVectorInRange(particleConfigs[particleConfigIndex].spawnDir, 2 * Math.PI / 180)
      vec3.scale(nP.velocity, nP.velocity, 4)
    } else {
      vec3.scale(nP.velocity, nP.velocity, 2)
    }
    nP.acceleration = vec3.fromValues(0, 0, 0)
    nP.birth = t
    nP.lifespan = particleConfigs[particleConfigIndex].lifespan
      ? particleConfigs[particleConfigIndex].lifespan
      : 1.0 + 2.0 * getUniformRand()
    nP.airResistanceCoeff = particleConfigs[particleConfigIndex].airResistanceCoeff

    nP.initialcolor = vec3.clone(nP.velocity)

    // make the directed (orbiting) particles blue
    if (particleConfigs[particleConfigIndex].spawnDir) {
      nP.initialcolor = vec3.fromValues(0.1, 0.1, 0.9)
    }
  }
  if (f > 1) {
    n = n + 1
    f = f - 1
  }
  return f
}

// compute the overall acceleration of each particle given the
// forces of gravity, air resistance, and wind (if any)
function plComputeAccelerations () { // eslint-disable-line no-unused-vars
  for (let i = 0; i < numParticles; i++) {
    if (!particles[i].active) {
      continue
    }

    particles[i].acceleration = vec3.fromValues(0, 0, 0)

    const gravityAccel = particleConfigs[particleConfigIndex].gravity
    // to start for air resistance, find the direction of the velocity
    // and flip the sign
    // need to clone the velocity vector or it will cause particles to stutter
    const airResistanceAccel = vec3.clone(particles[i].velocity)
    const windSpeed = vec3.fromValues(initialState.windSpeed[0], initialState.windSpeed[1], 0)
    vec3.add(airResistanceAccel, airResistanceAccel, windSpeed)
    vec3.scale(airResistanceAccel, airResistanceAccel, -particles[i].airResistanceCoeff / particles[i].mass)

    vec3.add(particles[i].acceleration, particles[i].acceleration, gravityAccel)
    vec3.add(particles[i].acceleration, particles[i].acceleration, airResistanceAccel)

    particleConfigs[particleConfigIndex].pointAttractors.forEach(function (pAtt) {
      const g = 6.67408e-11
      const pointToPoint = vec3.create()
      vec3.subtract(pointToPoint, particles[i].position, pAtt.point)
      const pointDistance = vec3.len(pointToPoint)
      if (pointDistance < 100 * EPSILON) {
        return
      }
      const direction = vec3.create()
      vec3.normalize(direction, pointToPoint)
      const attAccel = vec3.create()
      vec3.scale(attAccel, direction, -g * pAtt.mass / Math.pow(pointDistance, pAtt.power))
      vec3.add(particles[i].acceleration, particles[i].acceleration, attAccel)
    })
  }
}

// integrate each particle position based on the new acceleration
// and the average of the new velocity and previous velocity
function plIntegrate (timestep) { // eslint-disable-line no-unused-vars
  for (let i = 0; i < numParticles; i++) {
    if (!particles[i].active) {
      continue
    }
    const oldVelocity = particles[i].velocity
    const deltaVelocity = vec3.create()
    vec3.scale(deltaVelocity, particles[i].acceleration, timestep)
    vec3.add(particles[i].velocity, particles[i].velocity, deltaVelocity)
    const avgVelocityStep1 = vec3.create()
    vec3.add(avgVelocityStep1, oldVelocity, particles[i].velocity)
    const deltaPosition = vec3.create()
    vec3.scale(deltaPosition, avgVelocityStep1, 0.5 * timestep)
    vec3.add(particles[i].position, particles[i].position, deltaPosition)
  }
}
