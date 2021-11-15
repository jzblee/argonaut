// Argonaut - MatOps portion
// by Jason Lee

"use strict";

// standard linear interpolation for each component of a vec3
let simpleGLVec3MixFn = function(t, prevValue, nextValue){
  let interpolationX = (1.0 - t) * prevValue[0] + t * nextValue[0];
  let interpolationY = (1.0 - t) * prevValue[1] + t * nextValue[1];
  let interpolationZ = (1.0 - t) * prevValue[2] + t * nextValue[2];
  return vec3.fromValues(interpolationX, interpolationY, interpolationZ);
}

/*
  Creates a rotation matrix that will rotate given points such that the +Z axis of
  their coordinate frame matches the direction of the normal vector parameter
  supplied here.
*/
function getRotationMatrix(n_i) {
  // choose some other vector to get cross products, to generate our other axes
  let linearlyIndependentVector = vec3.fromValues(1, 0, 0);
  if (n_i[0] == 0 && n_i[1] == 0 && n_i[2] == 0) {
    console.error("ERROR: normal vector for triangle fan has length 0");
  } else if (n_i[0] != 0 && n_i[1] == 0 && n_i[2] == 0) {
    linearlyIndependentVector = vec3.fromValues(0, 1, 0);
  }

  // normalize n_i, just in case it isn't already so
  // also give it a new name for consistency with the other axes (forthcoming)
  vec3.normalize(n_i, n_i);
  let newZAxis = n_i;

  // generate the new X axis by getting cross product of
  // linearlyIndependentVector with n_i (the new Z axis)
  let newXAxis = vec3.create();
  vec3.cross(newXAxis, linearlyIndependentVector, n_i);
  vec3.normalize(newXAxis, newXAxis);

  let newYAxis = vec3.create();
  vec3.cross(newYAxis, n_i, newXAxis);
  vec3.normalize(newYAxis, newYAxis);

  // create a rotation matrix to rotate the disc into the coordinate frame given
  // by treating n_i as the +Z direction
  let rotation = mat4.fromValues(
    newXAxis[0], newXAxis[1], newXAxis[2], 0.0,
    newYAxis[0], newYAxis[1], newYAxis[2], 0.0,
    newZAxis[0], newZAxis[1], newZAxis[2], 0.0,
    0.0,         0.0,         0.0,         1.0
  );

  return rotation;
}

function calculateTriangleNormal(p_0, p_1, p_2) {
  let v_0 = vec3.create();
  let v_1 = vec3.create();
  let n_i = vec3.create();
  vec3.subtract(v_0, p_1, p_0);
  vec3.subtract(v_1, p_2, p_0);
  vec3.cross(n_i, v_0, v_1);
  vec3.normalize(n_i, n_i);
  return n_i;
}

// Unused, previously used for demonstrating line segments generated
// in random directions within a certain angle range
function generateUniformRandomVectorInRangeDemo(w, range) {
  let vtx = [];
  for (let i = 0; i < 100; i++) {
    let f = getUniformRand();
    let phi = Math.sqrt(f) * range;
    let theta = getUniformRand() * 2 * Math.PI - Math.PI;
    let rotationMatrix = getRotationMatrix(w);

    let v_prime = vec3.fromValues(
      Math.cos(theta) * Math.sin(phi),
      Math.sin(theta) * Math.sin(phi),
      Math.cos(phi)
    );
    let v = vec3.create();
    vec3.transformMat4(v, v_prime, rotationMatrix);
    vtx.push(0);
    vtx.push(0);
    vtx.push(0);
    vtx.push(v[0] * 32);
    vtx.push(v[1] * 32);
    vtx.push(v[2] * 32);
  }
  return vtx;
}
