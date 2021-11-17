// Argonaut - Simulation portion
// by Jason Lee

'use strict'

/* globals Sphere, vec3, Plane, vec2, EPSILON, generateParticles,
plTestAndDeactivate, plComputeAccelerations, numParticles,
particles, simpleGLVec3MixFn, plIntegrate */

const envboxTriangles = []

let simOut = null // eslint-disable-line no-unused-vars, prefer-const

const initialState = {
  tMax: 20,
  sphere: new Sphere(
    vec3.fromValues(0.0, 0.0, 0.0), // position
    vec3.fromValues(0.0, 0.0, 0.0), // velocity
    vec3.fromValues(0.0, -9.81, 0.0), // acceleration
    2.0 // radius
  ),
  env: [
    new Plane(
      vec3.fromValues(0.0, 0.0, 0.0), // pI
      vec3.fromValues(0.0, 1.0, 0.0) // nI
    )
  ],
  elasticityCoeff: 0.8,
  frictionCoeff: 0.5,
  airResistanceCoeff: 0.5,
  windSpeed: vec2.fromValues(0.0, 0.0), // used to be 0.0, 25.0
  mass: 1.0
}

/*
This file contains the timestep handler. Depends on gl-matrix-min.js for vector functionality.

TODO: load initial state; collision detection, multiple object collision detection,
      polygon representation, polygon collisions, collision response

Existing hookable components:
Scene configuration files
Bootstrap interface integration
Image sequence exporter
*/

const isInTriangle = function (p, p0, p1, p2) {
  // calculate triangle plane and normal
  // get triangle areas (cross products)
  // calculate barycentric ratios
  // return barycentric coordinates / boolean if inside
  const vN = vec3.create()
  const v0 = vec3.create()
  const v1 = vec3.create()

  vec3.subtract(v0, p1, p0)
  vec3.subtract(v1, p2, p1)
  vec3.cross(vN, v0, v1)

  const a = vec3.length(vN) / 2.0

  const nI = vec3.create()
  vec3.scale(nI, vN, 1.0 / (2.0 * a))

  const v2 = vec3.create()
  vec3.subtract(v2, p0, p2)

  const xSubP1 = vec3.create()
  const xSubP2 = vec3.create()
  vec3.subtract(xSubP1, p, p1)
  vec3.subtract(xSubP2, p, p2)
  const uIntermed = vec3.create()
  const vIntermed = vec3.create()
  vec3.cross(uIntermed, v1, xSubP1)
  vec3.cross(vIntermed, v2, xSubP2)

  const u = vec3.dot(uIntermed, nI) / (2.0 * a)
  const v = vec3.dot(vIntermed, nI) / (2.0 * a)
  const w = 1 - u - v
  return (u > -EPSILON && v > -EPSILON && w < 1 + EPSILON)
}

/* eslint-disable no-unused-vars */
const calculateDistanceFromPlane = function (p, pI, nI) {
  /* eslint-enable no-unused-vars */
  // take the distance from each triangle's center, project it to the normal
  const distance = vec3.create()
  vec3.subtract(distance, p, pI)
  const projectionFactor = vec3.dot(distance, nI) / vec3.dot(nI, nI)
  const projectedToNormal = vec3.create()
  vec3.scale(projectedToNormal, nI, projectionFactor)
  return vec3.length(projectedToNormal)
}

const calculateDerivative = function (state) { /* eslint-disable-line no-unused-vars */
  // calculate, collect sum of forces (e.g. gravity, wind, air resistance, etc)
  // for now, just use acceleration due to gravity
  // for air resistance, keep in mind the current velocity

  // let airResistanceIntermed = -state.airResistanceCoeff * vec3.length(state.sphere.velocity);
  // let airResistance = vec3.scale(state.sphere.velocity, airResistanceIntermed);
  const normalForce = getNormalForce(state)

  vec3.scale(normalForce, normalForce, 9.81)
  // const normalVel = vec3.create()
  // vec3.scale(normalVel, normalForce, vec3.length(state.sphere.velocity));

  return vec3.fromValues(0.0, -9.81, 0.0)
}

/* eslint-disable no-unused-vars */
const integrateNextStep = function (oldState, acceleration, timestep) {
  /* eslint-enable no-unused-vars */
  // Clone the old state using JSON tools to preserve a copy
  const newState = JSON.parse(JSON.stringify(oldState))
  newState.sphere.acceleration = acceleration
  const deltaVelocity = vec3.create()
  vec3.scale(deltaVelocity, oldState.sphere.acceleration, timestep)
  vec3.add(newState.sphere.velocity, oldState.sphere.velocity, deltaVelocity)
  const avgVelocityStep1 = vec3.create()
  vec3.add(avgVelocityStep1, oldState.sphere.velocity, newState.sphere.velocity)
  const deltaPosition = vec3.create()
  vec3.scale(deltaPosition, avgVelocityStep1, 0.5 * timestep)
  vec3.add(newState.sphere.position, oldState.sphere.position, deltaPosition)
  return newState
}

const getDistanceFromTriangle = function (point, triangleIndex) {
  const tri = envboxTriangles[triangleIndex]
  // project the distance between the center of the sphere and any point on the plane
  // onto the plane normal. if the length is greater than the radius on the old step
  // and less than on the new step, there was a collision

  // REMINDER: projecting A onto B:
  // (a dot b / b dot b) * b
  const projection = vec3.create()
  vec3.subtract(projection, point, tri.center)
  return vec3.dot(projection, tri.nI) / vec3.dot(tri.nI, tri.nI)
}

/*
 * TODO
 */
const collisionResponse = function (state) { /* eslint-disable-line no-unused-vars */
  // given the time and location of the collision, generate the correct collision
  // response given the elasticity and friction coefficients
  // divide velocity into normal and tangential components
  // compute elasticity and friction response
  // change the velocity of the object to the new velocity
  const normalForce = getNormalForce(state)
  const oldVel = state.sphere.velocity
  const velDir = vec3.create()
  vec3.normalize(velDir, state.sphere.velocity)
  console.log('NF-A', normalForce, state.elasticityCoeff, state.sphere.velocity)
  const coeffs = -state.elasticityCoeff * -vec3.dot(velDir, normalForce)
  vec3.scale(state.sphere.velocity, state.sphere.velocity, coeffs)
  const normalVel = vec3.create()
  vec3.scale(normalVel, normalForce, vec3.length(state.sphere.velocity))
  const tangentVel = vec3.create()
  console.log('NF-AB', normalVel)
  vec3.subtract(tangentVel, oldVel, normalVel)
  // vec3.scale(tangentVel, tangentVel, (1 - state.frictionCoeff));
  vec3.add(state.sphere.velocity, state.sphere.velocity, tangentVel)
  console.log('NF-B', normalForce, coeffs, state.sphere.velocity)

  // state.sphere.velocity[1] = -state.elasticityCoeff * state.sphere.velocity[1];
  return state
}

const getNormalForce = function (state) {
  const contactingTriangles = []
  for (let i = 0; i < envboxTriangles.length; i++) {
    const distance = getDistanceFromTriangle(state.sphere.position, i)
    // console.log(i, distance);
    if (Math.abs(distance) - state.sphere.radius < 100 * EPSILON) {
      contactingTriangles.push(envboxTriangles[i].nI)
    }
  }
  const triangleNormalSum = vec3.create()
  for (let i = 0; i < contactingTriangles.length; i++) {
    vec3.add(triangleNormalSum, triangleNormalSum, contactingTriangles[i])
  }
  vec3.normalize(triangleNormalSum, triangleNormalSum)
  return triangleNormalSum
}

/*
 * TODO
 */
const atRest = function (state) { /* eslint-disable-line no-unused-vars */
  // is the velocity less than vel-epsilon?
  // is the distance to some plane less than pl-epsilon?
  // is the dot of force and normal less than f-epsilon?
  // is the tangential force less than the frictional force?
  // then the object is at rest
  const isVelocityZero = vec3.length(state.sphere.velocity) < EPSILON
  if (!isVelocityZero) {
    // console.log(vec3.length(state.sphere.velocity), " != 0");
    return false
  }
  const contactingTriangles = []
  for (let i = 0; i < envboxTriangles.length; i++) {
    const distance = getDistanceFromTriangle(state.sphere.position, i)
    // console.log(i, distance);
    if (Math.abs(distance) - state.sphere.radius < 100 * EPSILON) {
      contactingTriangles.push(envboxTriangles[i].nI)
    }
  }
  if (!contactingTriangles.length) {
    // console.log("cT.l = 0");
    return false
  }
  const triangleNormalSum = vec3.create()
  for (let i = 0; i < contactingTriangles.length; i++) {
    vec3.add(triangleNormalSum, triangleNormalSum, contactingTriangles[i])
  }
  vec3.normalize(triangleNormalSum, triangleNormalSum)
  const triangleNetForce = state.sphere.acceleration
  const isNetForceTowardNormal = vec3.dot(triangleNormalSum, triangleNetForce) < 2 * EPSILON

  if (!isNetForceTowardNormal) {
    return false
  }

  // TODO: FRICTIONAL FORCE

  // console.log("AT REST");

  return true
}

/*
 * TODO
 */
const collisionBetween = function (oldState, newState) { /* eslint-disable-line no-unused-vars */
  // dot oldState.sphere.position with oldState.plane.position (adjust for radius)
  // check for sign flips

  // in the future, each state will have an array of objects, and collision
  // detection will run on every pair of objects across two timesteps

  // for now, hardcode it to always check betweem the sphere and plane(s)

  // STEPS
  // iterate through each plane and check signs for old state and new state dot products
  // e.g.
  // scrutinize sphere position in relation to plane 1, plane 2, plane 3, plane 4

  // CORNER CASE: what if the sphere hits more than one plane/polygon at EXACT same time?
  // solution: create an array of all the collisions that occur during this instant. However,
  // unless you have lots and lots of objects, accounting for this corner case will be a
  // big waste of time

  // to give the if condition in the main simulation a hint, have the collision
  // determiner return an integer: -1 if no collisions, 0 or above if there is one,
  // with the returned integer corresponding to the index of the plane/polygon in
  // question.

  // for (let i = 0; i < oldState.env.length; i++) {
  //     let os_x = oldState.sphere.position;
  //     let os_p = oldState.env[i].pI;
  //     let os_n = oldState.env[i].nI;
  //     let os_r = oldState.sphere.radius;

  //     let oldDistance = vec3.dot(vec3.subtract(os_x, os_p), os_n);
  //     oldDistance = (oldDistance > 0) ? oldDistance + os_r : oldDistance - os_r;

  //     let ns_x = newState.sphere.position;
  //     let ns_p = newState.env[i].pI;
  //     let ns_n = newState.env[i].nI;
  //     let ns_r = newState.sphere.radius;

  //     let newDistance = vec3.dot(vec3.subtract(ns_x, ns_p), ns_n);
  //     newDistance = (newDistance > 0) ? newDistance + ns_r : newDistance - ns_r;

  //     if ((oldDistance > 0 && newDistance < 0) || (oldDistance < 0 && newDistance > 0)) {

  //     }
  // }

  let soonestCollisionTimestep = 1.0
  for (let i = 0; i < envboxTriangles.length; i++) {
    let oldDistance = getDistanceFromTriangle(oldState.sphere.position, i)
    let newDistance = getDistanceFromTriangle(newState.sphere.position, i)
    // determine where on plane the point coliision happened
    // determine exactly when the collision happened
    // determine if collision was within the bounds of triangle (barycentric)
    // console.log(i, oldDistance - oldState.sphere.radius, newDistance - oldState.sphere.radius);
    if (
      (oldDistance - oldState.sphere.radius > -EPSILON && newDistance - oldState.sphere.radius < EPSILON) ||
            (oldDistance + oldState.sphere.radius < EPSILON && newDistance + oldState.sphere.radius > -EPSILON)
    ) {
      if (oldDistance - oldState.sphere.radius > -EPSILON && newDistance - oldState.sphere.radius < EPSILON) {
        oldDistance -= oldState.sphere.radius
        newDistance -= newState.sphere.radius
      } else {
        oldDistance += oldState.sphere.radius
        newDistance += newState.sphere.radius
      }
      const collisionTimestep = oldDistance / (oldDistance - newDistance)
      const intersection = vec3.fromValues(
        collisionTimestep * oldState.sphere.position[0] + (1.0 - collisionTimestep) * newState.sphere.position[0],
        collisionTimestep * oldState.sphere.position[1] + (1.0 - collisionTimestep) * newState.sphere.position[1],
        collisionTimestep * oldState.sphere.position[2] + (1.0 - collisionTimestep) * newState.sphere.position[2]
      )
      if (!isInTriangle(intersection, envboxTriangles[i].p0, envboxTriangles[i].p1, envboxTriangles[i].p2)) {
        continue
      }
      if (collisionTimestep < soonestCollisionTimestep) {
        soonestCollisionTimestep = collisionTimestep
      }
    }
  }
  // console.log(soonestCollisionTimestep);
  return soonestCollisionTimestep
}

function simulate () { /* eslint-disable-line no-unused-vars */
  const spherePositions = []
  const sphereVelocities = []

  const particlePositions = []
  const particleColors = []

  let state = initialState // eslint-disable-line prefer-const
  const h = 0.025
  let n = 0; let t = 0
  let currentSimFrame = 0
  const fps = 40
  const maxFrame = Math.floor(state.tMax * fps) - 1
  // TODO: use f
  const f = 0 /* eslint-disable-line no-unused-vars */

  /* while (t < state.tMax) {
    // break // DEBUG: skip the sim loop for now
    console.log('step ' + n)

    currentSimFrame = Math.floor(t * fps)
    for (let i = currentSimFrame; i < Math.floor((t + h) * fps); i++) {
      spherePositions.push(state.sphere.position)
      sphereVelocities.push(state.sphere.velocity)
    }

    let timestepRemaining = h
    let timestep = timestepRemaining
    let stepLimit = 100
    /* while (timestepRemaining > EPSILON && stepLimit >= 0) {
      // get the accelerations
      const acceleration = calculateDerivative(state)
      // do the integrations
      let newState = integrateNextStep(state, acceleration, timestepRemaining)

      if (atRest(state)) {
        console.log('AT REST, ', currentSimFrame)
        break
      }

      const f = collisionBetween(state, newState)
      if (f < 1.0 - EPSILON) {
        // console.log("COLLISION");
        // let oldDistance = -1; // TODO: implement this value
        // let newDistance = -1; // TODO: implement this value
        // // calculate f to find the exact moment in the timestep of the collision
        // let deltaDistance = vec3.create();
        // vec3.add(deltaDistance, oldDistance, -newDistance);
        // let f = vec3.divide(oldDistance, deltaDistance);
        timestep = f * timestepRemaining - EPSILON

        if (timestep < EPSILON) {
          break // needed to help avoid big jumps at rest or phasing through planes
        }
        // console.log(h - timestepRemaining, timestep);
        newState = integrateNextStep(state, acceleration, timestep)
        newState = collisionResponse(newState)
        // newState.sphere.position[1] = state.sphere.position[1];
        // console.log(state.sphere.position[1], newState.sphere.position[1]);
      }
      timestepRemaining = timestepRemaining - timestep
      // console.log("timestepRemaining: ", timestepRemaining)
      state = newState
      stepLimit--
      // console.log(state.sphere)
    }

    n = n + 1
    t = n * h
  } */

  while (t < state.tMax) {
    // console.log("step " + n);
    currentSimFrame = Math.floor(t * fps)
    for (let i = 0; i < 1; i++) { // for each particle generator
      generateParticles(t, h) // does not keep track of truncation error
    }
    plTestAndDeactivate(t)
    plComputeAccelerations(t)
    if (Math.floor((t + h) * fps) > currentSimFrame) {
      // we are on an output frame, print the state
      // sometimes, the current sim frame will last for multiple output frames;
      // make sure to fill those or else there will be mismatches in the number
      // of output frames and the output particle positions
      // fill missing frames with duplicates of the most recent frame's data
      const newFrame = particlePositions.length
      for (let j = newFrame; j <= currentSimFrame; j++) {
        particlePositions.push([])
        particleColors.push([])
        for (let i = 0; i < numParticles; i++) {
          if (particles[i].active) {
            particlePositions[j].push(particles[i].position[0])
            particlePositions[j].push(particles[i].position[1])
            particlePositions[j].push(particles[i].position[2])
            const age = t - particles[i].birth
            let lifeProgress = age / particles[i].lifespan

            // hasten the fading of the particle colors
            lifeProgress = Math.sqrt(lifeProgress)

            const newColor = simpleGLVec3MixFn(
              lifeProgress,
              vec3.fromValues(
                0.5 * particles[i].initialcolor[0] + 0.5,
                0.5 * particles[i].initialcolor[1] + 0.5,
                0.5 * particles[i].initialcolor[2] + 0.5
              ),
              vec3.fromValues(0.8, 0.8, 0.8)
            )

            particleColors[j].push(newColor[0])
            particleColors[j].push(newColor[1])
            particleColors[j].push(newColor[2])
            particleColors[j].push(1)
          }
        }
      }
    }
    plIntegrate(h)
    n = n + 1
    t = n * h
  }
  return {
    fps: fps,
    maxFrame: maxFrame,
    spherePositions: spherePositions,
    sphereVelocities: sphereVelocities,
    particlePositions: particlePositions,
    particleColors: particleColors
  }
}
