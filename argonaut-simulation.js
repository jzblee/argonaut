// Argonaut - Simulation portion
// by Jason Lee

'use strict'

/* globals Sphere, vec3, Plane, vec2, EPSILON, generateParticles,
plTestAndDeactivate, plComputeAccelerations, numParticles,
particles, simpleGLVec3MixFn, plIntegrate computeRectangularPrisimInertia,
rbdState, ComputeRigidDerivative, scaleStateVector, addStateVectors, quat,
rbdCollisionWithPlane, rbdStates, rbdCollisionResponse,
configSets configIndex, rbdState, rbdCollisionPlaneHeight, rbdCubeS */

const envboxTriangles = []

let simOut = null // eslint-disable-line no-unused-vars, prefer-const

const initialState = {
  tMax: 20,
  sphere: new Sphere(
    vec3.fromValues(1.0, 4.0, 0.0), // position
    vec3.fromValues(0.0, 0.0, 0.0), // velocity
    vec3.fromValues(0.0, -9.81, 0.0), // acceleration
    1.0 // radius
  ),
  env: [
    new Plane(
      vec3.fromValues(0.0, 0.0, 0.0), // pI
      vec3.fromValues(0.0, 1.0, 0.0) // nI
    )
  ],
  elasticityCoeff: 0.8,
  frictionCoeff: 0.2,
  airResistanceCoeff: 0.5,
  windSpeed: vec2.fromValues(0.0, 0.0), // used to be 0.0, 25.0
  mass: 1.0
}

/*
This file contains the timestep handler and collision response for
a bouncing ball. Depends on gl-matrix-min.js for vector functionality.

TODO: multiple sphere collision detection and response
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
  
  // TODO: add air resistance
  // For air resistance, keep in mind the current velocity
  // let airResistanceIntermed = -state.airResistanceCoeff * vec3.length(state.sphere.velocity);
  // let airResistance = vec3.scale(state.sphere.velocity, airResistanceIntermed);
  const normalForce = getNormalForce(state)

  vec3.scale(normalForce, normalForce, 9.81)
  // const normalVel = vec3.create()
  // vec3.scale(normalVel, normalForce, vec3.length(state.sphere.velocity));

  // For now, the only constant force we are considering is from gravity
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

// Work in progress, implementing 4th order Runge-Kutta integration
/* eslint-disable no-unused-vars */
const integrateNextStepRK = function (oldState, acceleration, timestep) {
  /* eslint-enable no-unused-vars */
  // Clone the old state using JSON tools to preserve a copy
  const newState = JSON.parse(JSON.stringify(oldState))

  const k1 = newState.sphere.velocity

  const k2 = newState.sphere.velocity
  // WORK IN PROGRESS, IMPLEMENT RK

  newState.sphere.acceleration = acceleration
  const deltaVelocity = vec3.create()
  vec3.scale(deltaVelocity, oldState.sphere.acceleration, timestep)
  vec3.add(newState.sphere.velocity, oldState.sphere.velocity, deltaVelocity)
  const avgVelocityStep1 = vec3.create()
  vec3.add(avgVelocityStep1, oldState.sphere.velocity, newState.sphere.velocity)
  const deltaPosition = vec3.create()
  vec3.scale(deltaPosition, avgVelocityStep1, 0.5 * timestep)
  vec3.add(newState.sphere.position, oldState.sphere.position, deltaPosition)
  // used to debug errant extra integrations at 40 fps
  // if (timestep < 0.025) {
  //   console.log(timestep, deltaVelocity, deltaPosition)
  // }
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

const collisionResponse = function (state) { /* eslint-disable-line no-unused-vars */
  // given the time and location of the collision, generate the correct collision
  // response given the elasticity and friction coefficients
  // divide velocity into normal and tangential components
  // compute elasticity and friction response
  // change the velocity of the object to the new velocity
  const normalForce = getNormalForce(state)
  const newVel = vec3.create()
  vec3.add(newVel, newVel, state.sphere.velocity)
  // console.log('VEL', state.sphere.velocity, oldVel)
  // console.log('NF-A', { normal: normalForce, elC: state.elasticityCoeff, vel: newVel })
  const normalVel = vec3.create()
  // console.log('NV1', normalVel)
  vec3.scale(normalVel, normalForce, vec3.dot(newVel, normalForce))
  // console.log('NV2', normalVel)
  const tangentVel = vec3.create()
  vec3.subtract(tangentVel, newVel, normalVel)
  // This next line used to be above the tangent velocity calculation,
  // which is incorrect; only attenuate the velocity components
  // after separating them. otherwise we would be calculating the
  // "pre-collision" tangent velocity using the "post-collision"
  // normal velocity
  vec3.scale(normalVel, normalVel, -state.elasticityCoeff)
  vec3.scale(tangentVel, tangentVel, (1 - state.frictionCoeff))
  vec3.add(state.sphere.velocity, normalVel, tangentVel)
  // console.log('NF-B', { normal: normalForce, elC: state.elasticityCoeff, newVel: state.sphere.velocity })
  return state
}

const getNormalForce = function (state) {
  const contactingTriangles = []
  for (let i = 0; i < envboxTriangles.length; i++) {
    const distance = getDistanceFromTriangle(state.sphere.position, i)
    if (Math.abs(distance) - state.sphere.radius < 2 * EPSILON) {
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
  // much lower priority

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
  const fps = 24
  let maxFrame = Math.floor(state.tMax * fps) - 1
  // TODO: use f and to compensate for leftover frames (see textbook)
  const f = 0 /* eslint-disable-line no-unused-vars */

  if (configSets[configIndex].simType.data === 'bouncingball') {
    while (t < state.tMax) {
      // console.log('step ' + n)

      currentSimFrame = Math.floor(t * fps)
      const nextSimFrame = Math.floor((t + h + EPSILON) * fps)
      // console.log(currentSimFrame, nextSimFrame)
      // if these are equal, don't push anything and wait till the
      // next timestep to push an output frame
      if (currentSimFrame !== nextSimFrame) {
        spherePositions.push(state.sphere.position)
        sphereVelocities.push(state.sphere.velocity)
        for (let i = currentSimFrame + 1; i < nextSimFrame; i++) {
          // console.log('step ' + i, Math.floor((t + h) * fps))
          spherePositions.push(state.sphere.position)
          sphereVelocities.push(state.sphere.velocity)
        }
      }

      let timestepRemaining = h
      let timestep = timestepRemaining
      let stepLimit = 100
      while (timestepRemaining > EPSILON && stepLimit >= 0) {
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
          timestep = f * timestepRemaining

          if (timestep < EPSILON) {
            break // needed to help avoid big jumps at rest or phasing through planes
          }
          // console.log(h - timestepRemaining, timestep)
          newState = integrateNextStep(state, acceleration, timestep)
          newState = collisionResponse(newState)
          // console.log(state.sphere.position[1], newState.sphere.position[1])
          // console.log(state.sphere.velocity[1], newState.sphere.velocity[1])
        } else {
          // if there is no collision, consume the rest of the unused timestep
          timestep = timestepRemaining
        }
        timestepRemaining = timestepRemaining - timestep
        // console.log('timestepRemaining: ', timestepRemaining)
        state = newState
        stepLimit--
        // console.log(state.sphere)
      }

      n = n + 1
      t = n * h
    }
  } else if (configSets[configIndex].simType.data === 'particles') {
    // PARTICLE SIM
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
                darkModeEnabled ? vec3.fromValues(0.2, 0.2, 0.2) : vec3.fromValues(0.8, 0.8, 0.8)
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
  } else if (configSets[configIndex].simType.data === 'rbd') {
    const tMax = 10
    t = 0
    let tOutput = 0

    const planeNormal = vec3.fromValues(0, 1, 0)
    const planePoint = vec3.fromValues(0, rbdCollisionPlaneHeight, 0)

    const m = 1
    const inertia = computeRectangularPrisimInertia(m, rbdCubeS * 2, rbdCubeS * 2, rbdCubeS * 2)
    maxFrame = Math.floor(tMax * fps) - 1

    while (t < tMax) {
      let timestepRemaining = h
      let timestep = timestepRemaining
      let stepLimit = 100

      let sNew = null
      const oldState = JSON.parse(JSON.stringify(rbdState))
      while (timestepRemaining > EPSILON && stepLimit >= 0) {
        const rbdStateDerivative = ComputeRigidDerivative(rbdState, m, inertia)
        // console.log(timestepRemaining, timestep, rbdStateDerivative)
        sNew = scaleStateVector(timestepRemaining, rbdStateDerivative)
        sNew = addStateVectors(rbdState, sNew)
        quat.normalize(sNew.q, sNew.q)

        const [f, collisionPoint] = rbdCollisionWithPlane(oldState, sNew, planePoint, planeNormal)
        if (f < 1.0 - EPSILON) {
          timestep = f * timestepRemaining

          // console.log('COLLISION')
          // console.log('COLLISION', t, collisionPoint)

          if (timestep < EPSILON) {
            timestepRemaining = 0
            timestep = 0
            sNew = oldState
          }

          // if timestep is too small, avoid re-integrating and just move to collision response
          if (timestep > EPSILON) {
            sNew = scaleStateVector(timestep, rbdStateDerivative)
            sNew = addStateVectors(rbdState, sNew)
            quat.normalize(sNew.q, sNew.q)
          }

          sNew = rbdCollisionResponse(sNew, rbdStateDerivative, collisionPoint, planeNormal, m, inertia)
        } else {
          timestep = timestepRemaining
        }
        rbdState = sNew
        timestepRemaining = timestepRemaining - timestep
        // console.log("timestepRemaining: ", timestepRemaining)
        stepLimit--
      }
      if (t > tOutput) {
        // output frame
        rbdStates.push(JSON.parse(JSON.stringify(rbdState)))
        tOutput += 1.0 / fps
      }
      t += h
    }
  }
  return {
    fps: fps,
    maxFrame: maxFrame,
    spherePositions: spherePositions,
    sphereVelocities: sphereVelocities,
    particlePositions: particlePositions,
    particleColors: particleColors,
    rbdStates: rbdStates
  }
}
