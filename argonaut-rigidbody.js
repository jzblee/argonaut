// Argonaut - Rigid body portion
// by Jason Lee

'use strict'

// These globals are holdovers from the particle file, fill them in
// with the correct ones later
/* global quat, mat3, vec3, generateUniformRandomVector
generateUniformRandomVectorInRange, getUniformRand,
initialState, EPSILON */

const rbdCubeS = 1.0

const cubeObj = {
  position: [
    rbdCubeS, rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, rbdCubeS,
    rbdCubeS, -rbdCubeS, rbdCubeS,
    rbdCubeS, -rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, rbdCubeS,
    -rbdCubeS, -rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, -rbdCubeS,
    rbdCubeS, rbdCubeS, -rbdCubeS,
    -rbdCubeS, -rbdCubeS, -rbdCubeS,
    -rbdCubeS, -rbdCubeS, -rbdCubeS,
    rbdCubeS, rbdCubeS, -rbdCubeS,
    rbdCubeS, -rbdCubeS, -rbdCubeS,
    -rbdCubeS, -rbdCubeS, rbdCubeS,
    -rbdCubeS, -rbdCubeS, -rbdCubeS,
    rbdCubeS, -rbdCubeS, rbdCubeS,
    rbdCubeS, -rbdCubeS, rbdCubeS,
    -rbdCubeS, -rbdCubeS, -rbdCubeS,
    rbdCubeS, -rbdCubeS, -rbdCubeS,
    rbdCubeS, rbdCubeS, rbdCubeS,
    rbdCubeS, rbdCubeS, -rbdCubeS,
    -rbdCubeS, rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, rbdCubeS,
    rbdCubeS, rbdCubeS, -rbdCubeS,
    -rbdCubeS, rbdCubeS, -rbdCubeS,
    -rbdCubeS, -rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, rbdCubeS,
    -rbdCubeS, -rbdCubeS, -rbdCubeS,
    -rbdCubeS, -rbdCubeS, -rbdCubeS,
    -rbdCubeS, rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, -rbdCubeS,
    rbdCubeS, -rbdCubeS, rbdCubeS,
    rbdCubeS, -rbdCubeS, -rbdCubeS,
    rbdCubeS, rbdCubeS, rbdCubeS,
    rbdCubeS, rbdCubeS, rbdCubeS,
    rbdCubeS, -rbdCubeS, -rbdCubeS,
    rbdCubeS, rbdCubeS, -rbdCubeS
  ],
  vertices: [
    rbdCubeS, rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, rbdCubeS,
    rbdCubeS, -rbdCubeS, rbdCubeS,
    -rbdCubeS, -rbdCubeS, rbdCubeS,
    -rbdCubeS, rbdCubeS, -rbdCubeS,
    rbdCubeS, rbdCubeS, -rbdCubeS,
    rbdCubeS, -rbdCubeS, -rbdCubeS,
    -rbdCubeS, -rbdCubeS, -rbdCubeS
  ],
  // normal: [
  //   0, 0, 1,
  //   0, 0, 1,
  //   0, 0, 1,
  //   0, 0, 1,
  //   0, 0, 1,
  //   0, 0, 1,
  //   0, 0, -1,
  //   0, 0, -1,
  //   0, 0, -1,
  //   0, 0, -1,
  //   0, 0, -1,
  //   0, 0, -1,
  //   0, -1, 0,
  //   0, -1, 0,
  //   0, -1, 0,
  //   0, -1, 0,
  //   0, -1, 0,
  //   0, -1, 0,
  //   0, 1, 0,
  //   0, 1, 0,
  //   0, 1, 0,
  //   0, 1, 0,
  //   0, 1, 0,
  //   0, 1, 0,
  //   -1, 0, 0,
  //   -1, 0, 0,
  //   -1, 0, 0,
  //   -1, 0, 0,
  //   -1, 0, 0,
  //   -1, 0, 0,
  //   1, 0, 0,
  //   1, 0, 0,
  //   1, 0, 0,
  //   1, 0, 0,
  //   1, 0, 0,
  //   1, 0, 0
  // ],
  color: { value: [1, 1, 1, 1] }
}

let rbdStates = []

let rbdState = {
  x: vec3.fromValues(0, 4, 0), // position
  P: vec3.fromValues(0, 0, 0), // linear momentum
  L: vec3.fromValues(0, 0, 0), // angular momentum
  q: quat.fromValues(0, 0, 0, 0) // rotation
}

// generate a random starting rotation
rbdState.q = quat.fromValues(getUniformRand(), getUniformRand(), getUniformRand(), getUniformRand())
quat.normalize(rbdState.q, rbdState.q)

let rbdOnInitialFrame = true

const rbdCollisionPlaneHeight = -3

const forces = [
  {
    vector: vec3.fromValues(0, -9.81, 0),
    p: null,
    initialOnly: false
  },
  {
    vector: vec3.fromValues(0, -10, 2),
    // vector: vec3.fromValues(0, 0, 0),
    p: vec3.fromValues(rbdCubeS, rbdCubeS, rbdCubeS),
    initialOnly: true
  }
  // each force has a direction
  // if it's a non-body force, it should also have
  // a point p denoting the point of application
  // in the future, it should also have an id of the object it affects
]

// NEEDS:
// READ about quaternions
// READ about multiple body collisions
// READ about spatial data structures

function computeRectangularPrisimInertia (mass, length, width, height) {
  return mat3.fromValues(
    mass / 12 * (Math.pow(width, 2) + Math.pow(height, 2)), 0, 0,
    0, mass / 12 * (Math.pow(length, 2) + Math.pow(width, 2)), 0,
    0, 0, mass / 12 * (Math.pow(length, 2) + Math.pow(height, 2))
  )
}

// Description of the RBD integration algorithm:

// State ComputeRigidDerivative(State S, float m, mat3 inverseInertialMatrixLocal)

// State = {x, P, L, q}

// inertia parameter is the inverse of the moment of inertia in the body coordinate system
function ComputeRigidDerivative (state, m, inertia) {
  // initialize state vector derivative
  const rbdStateDerivative = {
    x: vec3.fromValues(0, 0, 0), // velocity, P/m
    P: vec3.fromValues(0, 0, 0), // sum of forcs, derivative of linear momentum P
    L: vec3.fromValues(0, 0, 0), // sum of torques (change in angular momentum) - r x f
    q: quat.fromValues(0, 0, 0, 0) // change in rotation
  }

  // calculate velocity (i.e. position derivative) = S.P / m
  vec3.scale(rbdStateDerivative.x, rbdState.P, 1.0 / m)

  // convert rotation quaternion to matrix
  const rotationMatrix = mat3.create()
  mat3.fromQuat(rotationMatrix, rbdState.q)

  const rotationTranspose = mat3.create()
  mat3.transpose(rotationTranspose, rotationMatrix)
  // rotate body inverted inertia matrix into world coord frame
  // multiply inertia matrix by rotation matrix
  const inertiaInverse = mat3.create()
  mat3.multiply(inertiaInverse, rotationMatrix, inertia)
  mat3.multiply(inertiaInverse, inertiaInverse, rotationTranspose)

  // calculate angular velocity by multiplying world inverted inertia by angular momentum
  const omega = vec3.create()
  vec3.transformMat3(omega, rbdState.L, inertiaInverse)

  // create a quaternion from this angular velocity
  const omegaQuaternion = quat.fromValues(omega[0], omega[1], omega[2], 0)

  // S-dot's q is 1/2 * angular velocity quaternion * original rotation quaternion (S.q)
  rbdStateDerivative.q = quat.create()
  quat.scale(rbdStateDerivative.q, omegaQuaternion, 0.5)
  quat.multiply(rbdStateDerivative.q, rbdStateDerivative.q, rbdState.q)

  // zero out the S-dot.P and S-dot.L values (force and torque)
  rbdStateDerivative.P = vec3.create()
  rbdStateDerivative.L = vec3.create()

  // For each force acting on the point,
  // sum the forces
  // for each of these forces that is a non-body force (i.e. acting on some point [])
  //  then calculate the moment arm and cross with the force to get torque
  //  sum each torque for net torque

  for (const { vector, p, initialOnly } of forces) {
    if (!rbdOnInitialFrame && initialOnly) {
      continue
    }
    vec3.add(rbdStateDerivative.P, rbdStateDerivative.P, vector)
    if (p) {
      const momentArm = vec3.create()
      vec3.subtract(momentArm, p, rbdState.x)

      const newTorque = vec3.create()
      vec3.cross(newTorque, momentArm, vector)
      vec3.add(rbdStateDerivative.L, rbdStateDerivative.L, newTorque)
    }
  }
  rbdOnInitialFrame = false // disable adding of the initial forces/torques

  // when all are integrated, return the S-dot
  return rbdStateDerivative

  // END routine
}

function addStateVectors (s1, s2) {
  // Making sure to only act on a copy of the state variabl
  // solved a bug that I spent hours on
  // it feels great to fix though!
  const newState = JSON.parse(JSON.stringify(s1))
  for (const key in s1) {
    if (key === 'q') {
      quat.add(newState[key], s1[key], s2[key])
    } else {
      vec3.add(newState[key], s1[key], s2[key])
    }
  }
  return newState
}

function scaleStateVector (scalar, state) {
  // Making sure to only act on a copy of the state variabl
  // solved a bug that I spent hours on
  // it feels great to fix though!
  const newState = JSON.parse(JSON.stringify(state))
  for (const key in state) {
    if (key === 'q') {
      quat.scale(newState[key], state[key], scalar)
    } else {
      vec3.scale(newState[key], state[key], scalar)
    }
  }
  return newState
}

function RigidMotion () {
  // initialize a bunch of states
  // S, S_new, S-dot

  const tMax = 30
  let t = 0
  const h = 0.05
  let tOutput = 0

  const m = 1
  const inertia = computeRectangularPrisimInertia(m, rbdCubeS * 2, rbdCubeS * 2, rbdCubeS * 2)

  // Initialize state (from initial state), mass, moment of inertia

  while (t < tMax) {
    const rbdStateDerivative = ComputeRigidDerivative(rbdState, m, inertia)
    let sNew = scaleStateVector(h, rbdStateDerivative)
    sNew = addStateVectors(rbdState, sNew)
    quat.normalize(sNew.q, sNew.q)
    if (t > tOutput) {
      // output frame
      rbdStates.push(rbdState)
      tOutput += 1 / 40 // TODO: fix FPS, don't hardcode
    }
    rbdState = sNew
    t += h
  }

  // while t is less than tMax
  //  compute the S-dot using the above function
  //  S_new = S + S-dot * h
  //  Normalize(S_new.q)
  // if t is bigger than tOutput
  //  display the frame
  //  bump the time for the next output
  // S = S_new
  // t += h
}

function getDistanceFromPlane(pointToCheck, pointOnPlane, planeNormal) {
  const projection = vec3.create()
  vec3.subtract(projection, pointToCheck, pointOnPlane)
  return vec3.dot(projection, planeNormal) / vec3.dot(planeNormal, planeNormal)
}

function computeRBDVertices (state) {
  // use the state vector, position and rotation, to compute
  // the position of the cube vertices
  const vertices = []
  for (let i = 0; i < cubeObj.vertices.length; i += 3) {
    const rotation = mat4.create()
    const matrix = mat4.create()

    mat4.fromQuat(rotation, state.q)
    mat4.translate(matrix, matrix, vec3.fromValues(state.x[0], state.x[1], state.x[2]))
    mat4.multiply(matrix, matrix, rotation)

    const point = vec3.fromValues(cubeObj.vertices[i], cubeObj.vertices[i + 1], cubeObj.vertices[i + 2])
    vec3.transformMat4(point, point, matrix)
    vertices.push(point)
  }
  return vertices
}

function rbdCollisionWithPlane (oldState, newState, planePoint, planeNormal) {
  let soonestCollisionTimestep = 1.0
  // generate the plane, see if any RBD collides with it

  const oldStateVertices = computeRBDVertices(oldState)
  const newStateVertices = computeRBDVertices(newState)

  // console.log(oldStateVertices, newStateVertices)

  let collisionPoint = null

  for (let i = 0; i < oldStateVertices.length; i++) {
    let oldDistance = getDistanceFromPlane(oldStateVertices[i], planePoint, planeNormal)
    let newDistance = getDistanceFromPlane(newStateVertices[i], planePoint, planeNormal)
    // determine where on plane the point coliision happened
    // determine exactly when the collision happened
    // determine if collision was within the bounds of triangle (barycentric)
    // console.log(i, oldDistance - oldState.sphere.radius, newDistance - oldState.sphere.radius);
    // console.log(oldDistance, newDistance)
    if (
      (oldDistance > -EPSILON && newDistance < EPSILON) ||
            (oldDistance < EPSILON && newDistance > -EPSILON)
    ) {
      const collisionTimestep = oldDistance / (oldDistance - newDistance)
      const intersection = vec3.fromValues(
        collisionTimestep * oldStateVertices[i][0] + (1.0 - collisionTimestep) * newStateVertices[i][0],
        collisionTimestep * oldStateVertices[i][1] + (1.0 - collisionTimestep) * newStateVertices[i][1],
        collisionTimestep * oldStateVertices[i][2] + (1.0 - collisionTimestep) * newStateVertices[i][2]
      )
      // This is checking to see if the collision is within a face/tri, but since the plane is infinite it doesn't matter
      // if (!isInTriangle(intersection, envboxTriangles[i].p0, envboxTriangles[i].p1, envboxTriangles[i].p2)) {
      //   continue
      // }
      if (collisionTimestep < soonestCollisionTimestep) {
        collisionPoint = oldStateVertices[i]
        soonestCollisionTimestep = collisionTimestep
      }
    }
  }
  // console.log(soonestCollisionTimestep);
  return [soonestCollisionTimestep, collisionPoint]
}

function rbdCollisionResponse(state, stateDeriv, collisionPoint, planeNormal, m, inertia) {
  // REUSED CODE FROM computeRigidDerivative
  // convert rotation quaternion to matrix
  const rotationMatrix = mat3.create()
  mat3.fromQuat(rotationMatrix, state.q)

  const rotationTranspose = mat3.create()
  mat3.transpose(rotationTranspose, rotationMatrix)
  // rotate body inverted inertia matrix into world coord frame
  // multiply inertia matrix by rotation matrix
  const inertiaInverse = mat3.create()
  mat3.multiply(inertiaInverse, rotationMatrix, inertia)
  mat3.multiply(inertiaInverse, inertiaInverse, rotationTranspose)
  // END REUSED CODE

  const restitutionCoeff = 0.65

  const n = vec3.create()
  vec3.normalize(n, planeNormal)

  const originalLVelocity = stateDeriv.x
  const originalAVelocity = vec3.create()
  vec3.transformMat3(originalAVelocity, state.L, inertiaInverse)

  // console.log(originalLVelocity, originalAVelocity)

  // vector from center of mass to collision point
  const rA = vec3.create()
  vec3.subtract(rA, collisionPoint, state.x)

  const pA = vec3.create()
  vec3.add(pA, pA, originalLVelocity)

  // console.log(originalLVelocity)

  // cross product of rA and omega-A
  const rXw = vec3.create()
  vec3.cross(rXw, originalAVelocity, rA)
  vec3.add(pA, pA, rXw)

  // rA cross n-hat
  const rXn = vec3.create()
  vec3.cross(rXn, rA, n)
  vec3.transformMat3(rXn, rXn, inertiaInverse)
  vec3.cross(rXn, rXn, rA)

  const nDotThat = vec3.dot(n, rXn)

  const vMinus = vec3.dot(pA, planeNormal)

  let j = -(1 + restitutionCoeff) * vMinus / ((1.0 / m) + nDotThat)

  // console.log(vMinus, nDotThat, j)

  const J = vec3.create()
  vec3.scale(J, planeNormal, j)

  const newState = JSON.parse(JSON.stringify(state))

  vec3.add(newState.P, state.P, J)

  const deltaL = vec3.create()
  vec3.cross(deltaL, rA, J)

  vec3.add(newState.L, state.L, deltaL)
  // console.log(j, J)
  // console.log(state)
  return newState
}
