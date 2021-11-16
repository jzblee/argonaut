// Argonaut - Simulation portion
// by Jason Lee

"use strict";

let envboxTriangles = [];

let simOut = null;

let initialState = {
    tMax: 20,
    sphere: new Sphere(
        vec3.fromValues(0.0, 0.0, 0.0), // position
        vec3.fromValues(0.0, 0.0, 0.0), // velocity
        vec3.fromValues(0.0, -9.81, 0.0), // acceleration
        2.0 // radius
    ),
    env: [
        new Plane(
            vec3.fromValues(0.0, 0.0, 0.0), // p_i
            vec3.fromValues(0.0, 1.0, 0.0) // n_i
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

let isInTriangle = function(p, p_0, p_1, p_2) {
    // calculate triangle plane and normal
    // get triangle areas (cross products)
    // calculate barycentric ratios
    // return barycentric coordinates / boolean if inside
    let v_n = vec3.create();
    let v_0 = vec3.create();
    let v_1 = vec3.create();

    vec3.subtract(v_0, p_1, p_0);
    vec3.subtract(v_1, p_2, p_1);
    vec3.cross(v_n, v_0, v_1);

    let a = vec3.length(v_n) / 2.0;

    let n_i = vec3.create();
    vec3.scale(n_i, v_n, 1.0 / (2.0 * a));

    let v_2 = vec3.create();
    vec3.subtract(v_2, p_0, p_2);

    let x_p_1 = vec3.create();
    let x_p_2 = vec3.create();
    vec3.subtract(x_p_1, p, p_1);
    vec3.subtract(x_p_2, p, p_2);
    let u_intermed = vec3.create();
    let v_intermed = vec3.create();
    vec3.cross(u_intermed, v_1, x_p_1);
    vec3.cross(v_intermed, v_2, x_p_2);

    let u = vec3.dot(u_intermed, n_i) / (2.0 * a);
    let v = vec3.dot(v_intermed, n_i) / (2.0 * a);
    let w = 1 - u - v;
    return (u > -EPSILON && v > -EPSILON && w < 1 + EPSILON);
}

let calculateDistanceFromPlane = function(p, p_i, n_i) {
    // take the distance from each triangle's center, project it to the normal
    let distance = vec3.create();
    vec3.subtract(distance, p, p_i);
    let projection_factor = vec3.dot(distance, n_i) / vec3.dot(n_i, n_i);
    let projected_to_normal = vec3.create();
    vec3.scale(projected_to_normal, n_i, projection_factor);
    return vec3.length(projected_to_normal);
}

/*
 *
 */
let calculateDerivative = function(state) {
    // calculate, collect sum of forces (e.g. gravity, wind, air resistance, etc)
    // for now, just use acceleration due to gravity
    // for air resistance, keep in mind the current velocity

    // let airResistanceIntermed = -state.airResistanceCoeff * vec3.length(state.sphere.velocity);
    // let airResistance = vec3.scale(state.sphere.velocity, airResistanceIntermed);
    let normalForce = getNormalForce(state);

    vec3.scale(normalForce, normalForce, 9.81);
    let normalVel = vec3.create();
    // vec3.scale(normalVel, normalForce, vec3.length(state.sphere.velocity));

    return vec3.fromValues(0.0, -9.81, 0.0);
}

/*
 *
 */
let integrateNextStep = function(oldState, acceleration, timestep) {
    // Clone the old state using JSON tools to preserve a copy
    let newState = JSON.parse(JSON.stringify(oldState));
    newState.sphere.acceleration = acceleration;
    let deltaVelocity = vec3.create();
    vec3.scale(deltaVelocity, oldState.sphere.acceleration, timestep);
    vec3.add(newState.sphere.velocity, oldState.sphere.velocity, deltaVelocity);
    let avgVelocityStep1 = vec3.create();
    vec3.add(avgVelocityStep1, oldState.sphere.velocity, newState.sphere.velocity);
    let deltaPosition = vec3.create();
    vec3.scale(deltaPosition, avgVelocityStep1, 0.5 * timestep)
    vec3.add(newState.sphere.position, oldState.sphere.position, deltaPosition);
    return newState;
}

let getDistanceFromTriangle = function(point, triangleIndex) {
    let n_i = envboxTriangles[triangleIndex].n_i;
    // project the distance between the center of the sphere and any point on the plane
    // onto the plane normal. if the length is greater than the radius on the old step
    // and less than on the new step, there was a collision
    
    // REMINDER: projecting A onto B:
    // (a dot b / b dot b) * b
    let projection = vec3.create();
    vec3.subtract(projection, point, envboxTriangles[triangleIndex].center);
    return vec3.dot(projection, envboxTriangles[triangleIndex].n_i) / vec3.dot(envboxTriangles[triangleIndex].n_i, envboxTriangles[triangleIndex].n_i);
}

/*
 * TODO
 */
let collisionResponse = function(state) {
    // given the time and location of the collision, generate the correct collision
    // response given the elasticity and friction coefficients
    // divide velocity into normal and tangential components
    // compute elasticity and friction response
    // change the velocity of the object to the new velocity
    let normalForce = getNormalForce(state);
    let oldVel = state.sphere.velocity;
    let velDir = vec3.create();
    vec3.normalize(velDir, state.sphere.velocity);
    console.log("NF-A", normalForce, state.elasticityCoeff, state.sphere.velocity);
    let coeffs = -state.elasticityCoeff * -vec3.dot(velDir, normalForce);
    vec3.scale(state.sphere.velocity, state.sphere.velocity, coeffs);
    let normalVel = vec3.create();
    vec3.scale(normalVel, normalForce, vec3.length(state.sphere.velocity));
    let tangentVel = vec3.create();
    console.log("NF-AB", normalVel);
    vec3.subtract(tangentVel, oldVel, normalVel);
    // vec3.scale(tangentVel, tangentVel, (1 - state.frictionCoeff));
    vec3.add(state.sphere.velocity, state.sphere.velocity, tangentVel);
    console.log("NF-B", normalForce, coeffs, state.sphere.velocity);

    // state.sphere.velocity[1] = -state.elasticityCoeff * state.sphere.velocity[1];
    return state;
}

let getNormalForce = function(state) {
  let contactingTriangles = [];
  for (let i = 0; i < envboxTriangles.length; i++) {
    let distance = getDistanceFromTriangle(state.sphere.position, i);
    // console.log(i, distance);
    if (Math.abs(distance) - state.sphere.radius < 100 * EPSILON) {
        contactingTriangles.push(envboxTriangles[i].n_i);
    }
  }
  let triangleNormalSum = vec3.create();
  for (let i = 0; i < contactingTriangles.length; i++) {
      vec3.add(triangleNormalSum, triangleNormalSum, contactingTriangles[i]);
  }
  vec3.normalize(triangleNormalSum, triangleNormalSum);
  return triangleNormalSum;
}

/*
 * TODO
 */
let atRest = function(state) {
    // is the velocity less than vel-epsilon?
    // is the distance to some plane less than pl-epsilon?
    // is the dot of force and normal less than f-epsilon?
    // is the tangential force less than the frictional force?
    // then the object is at rest
    let isVelocityZero = vec3.length(state.sphere.velocity) < EPSILON;
    if (!isVelocityZero) {
        // console.log(vec3.length(state.sphere.velocity), " != 0");
        return false;
    }
    let contactingTriangles = [];
    for (let i = 0; i < envboxTriangles.length; i++) {
        let distance = getDistanceFromTriangle(state.sphere.position, i);
        // console.log(i, distance);
        if (Math.abs(distance) - state.sphere.radius < 100 * EPSILON) {
            contactingTriangles.push(envboxTriangles[i].n_i);
        }
    }
    if (!contactingTriangles.length) {
        // console.log("cT.l = 0");
        return false;
    }
    let triangleNormalSum = vec3.create();
    for (let i = 0; i < contactingTriangles.length; i++) {
        vec3.add(triangleNormalSum, triangleNormalSum, contactingTriangles[i]);
    }
    vec3.normalize(triangleNormalSum, triangleNormalSum);
    let triangleNetForce = state.sphere.acceleration;
    let isNetForceTowardNormal = vec3.dot(triangleNormalSum, triangleNetForce) < 2 * EPSILON;

    if (!isNetForceTowardNormal) {
        return false;
    }

    // TODO: FRICTIONAL FORCE

    // console.log("AT REST");

    return true;
}

/*
 * TODO
 */
let collisionBetween = function(oldState, newState) {
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
    //     let os_p = oldState.env[i].p_i;
    //     let os_n = oldState.env[i].n_i;
    //     let os_r = oldState.sphere.radius;

    //     let oldDistance = vec3.dot(vec3.subtract(os_x, os_p), os_n);
    //     oldDistance = (oldDistance > 0) ? oldDistance + os_r : oldDistance - os_r;

    //     let ns_x = newState.sphere.position;
    //     let ns_p = newState.env[i].p_i;
    //     let ns_n = newState.env[i].n_i;
    //     let ns_r = newState.sphere.radius;

    //     let newDistance = vec3.dot(vec3.subtract(ns_x, ns_p), ns_n);
    //     newDistance = (newDistance > 0) ? newDistance + ns_r : newDistance - ns_r;

    //     if ((oldDistance > 0 && newDistance < 0) || (oldDistance < 0 && newDistance > 0)) {

    //     }
    // }

    let soonest_collision_timestep = 1.0;
    for (let i = 0; i < envboxTriangles.length; i++) {
        let oldDistance = getDistanceFromTriangle(oldState.sphere.position, i);
        let newDistance = getDistanceFromTriangle(newState.sphere.position, i);
        // determine where on plane the point coliision happened
        // determine exactly when the collision happened
        // determine if collision was within the bounds of triangle (barycentric)
        // console.log(i, oldDistance - oldState.sphere.radius, newDistance - oldState.sphere.radius);
        if (
            (oldDistance - oldState.sphere.radius > -EPSILON && newDistance - oldState.sphere.radius < EPSILON)
            || (oldDistance + oldState.sphere.radius < EPSILON && newDistance + oldState.sphere.radius > -EPSILON)
        ) {
            if (oldDistance - oldState.sphere.radius > -EPSILON && newDistance - oldState.sphere.radius < EPSILON) {
                oldDistance -= oldState.sphere.radius;
                newDistance -= newState.sphere.radius;
            } else {
                oldDistance += oldState.sphere.radius;
                newDistance += newState.sphere.radius;
            }
            let collision_timestep = oldDistance / (oldDistance - newDistance);
            let intersection = vec3.fromValues(
                collision_timestep * oldState.sphere.position[0] + (1.0 - collision_timestep) * newState.sphere.position[0],
                collision_timestep * oldState.sphere.position[1] + (1.0 - collision_timestep) * newState.sphere.position[1],
                collision_timestep * oldState.sphere.position[2] + (1.0 - collision_timestep) * newState.sphere.position[2]
            );
            if (!isInTriangle(intersection, envboxTriangles[i].p_0, envboxTriangles[i].p_1, envboxTriangles[i].p_2)) {
                continue;
            }
            if (collision_timestep < soonest_collision_timestep) {
                soonest_collision_timestep = collision_timestep;
            }
        }
    }
    // console.log(soonest_collision_timestep);
    return soonest_collision_timestep;
}

function simulate() {
  let spherePositions = [];
  let sphereVelocities = [];

  let particlePositions = [];
  let particleColors = [];

  let state = initialState;
  let h = 0.025;
  let n = 0, t = 0;
  let currentSimFrame = 0;
  let fps = 40;
  let maxFrame = Math.floor(state.tMax * fps) - 1;
  let f = 0;

  /*while (t < state.tMax) {
    break;  // DEBUG: skip the sim loop for now
    console.log("step " + n);

    currentSimFrame = Math.floor(t * fps);
    for (let i = currentSimFrame; i < Math.floor((t + h) * fps); i++) {
      spherePositions.push(state.sphere.position);
      sphereVelocities.push(state.sphere.velocity);
    }

    let timestepRemaining = h;
    let timestep = timestepRemaining;
    let stepLimit = 100;
    while (timestepRemaining > EPSILON && stepLimit >= 0) {
        // get the accelerations
        let acceleration = calculateDerivative(state);
        // do the integrations
        let newState = integrateNextStep(state, acceleration, timestepRemaining);

        if (atRest(state)) {
          console.log("AT REST, ", currentSimFrame);
          break;
        }

        let f = collisionBetween(state, newState);
        if (f < 1.0 - EPSILON) {
            // console.log("COLLISION");
            // let oldDistance = -1; // TODO: implement this value
            // let newDistance = -1; // TODO: implement this value
            // // calculate f to find the exact moment in the timestep of the collision
            // let deltaDistance = vec3.create();
            // vec3.add(deltaDistance, oldDistance, -newDistance);
            // let f = vec3.divide(oldDistance, deltaDistance);
            timestep = f * timestepRemaining - EPSILON;

            if (timestep < EPSILON) {
              break; // needed to help avoid big jumps at rest or phasing through planes
            }
            // console.log(h - timestepRemaining, timestep);
            let oldPos = state.sphere.position;
            newState = integrateNextStep(state, acceleration, timestep);
            newState = collisionResponse(newState);
            // newState.sphere.position[1] = state.sphere.position[1];
            // console.log(state.sphere.position[1], newState.sphere.position[1]);
        }
        timestepRemaining = timestepRemaining - timestep;
        // console.log("timestepRemaining: ", timestepRemaining)
        state = newState;
        stepLimit--;
        // console.log(state.sphere);
    }

    n = n + 1;
    t = n * h;
  }*/

  while (t < state.tMax) {
    // console.log("step " + n);
    currentSimFrame = Math.floor(t * fps);
    for (let i = 0; i < 1; i++) { // for each particle generator
      generateParticles(t, h); // does not keep track of truncation error
    }
    pl_testAndDeactivate(t);
    pl_computeAccelerations(t);
    if (Math.floor((t + h) * fps) > currentSimFrame) {
      // we are on an output frame, print the state
      // sometimes, the current sim frame will last for multiple output frames;
      // make sure to fill those or else there will be mismatches in the number
      // of output frames and the output particle positions
      // fill missing frames with duplicates of the most recent frame's data
      let newFrame = particlePositions.length;
      for (let j = newFrame; j <= currentSimFrame; j++) {
        particlePositions.push([]);
        particleColors.push([]);
        for (let i = 0; i < numParticles; i++) {
          if (particles[i].active) {
            particlePositions[j].push(particles[i].position[0]);
            particlePositions[j].push(particles[i].position[1]);
            particlePositions[j].push(particles[i].position[2]);
            let age = t - particles[i].birth;
            let lifeProgress = age / particles[i].lifespan;

            // hasten the fading of the particle colors
            lifeProgress = Math.sqrt(lifeProgress);

            let newColor = simpleGLVec3MixFn(
              lifeProgress,
              vec3.fromValues(
                0.5 * particles[i].initialcolor[0] + 0.5,
                0.5 * particles[i].initialcolor[1] + 0.5,
                0.5 * particles[i].initialcolor[2] + 0.5
              ),
              vec3.fromValues(0.8, 0.8, 0.8)
            );

            particleColors[j].push(newColor[0]);
            particleColors[j].push(newColor[1]);
            particleColors[j].push(newColor[2]);
            particleColors[j].push(1);

          }
        }
      }
    }
    pl_integrate(h);
    n = n + 1;
    t = n * h;
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
