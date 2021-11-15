// Argonaut - Random portion
// by Jason Lee

"use strict";

let uniformRandTable = [];
let gaussianRandTable = [];

let uniformRandIndex = 0;
let gaussianRandIndex = 0;

function randomGaussian() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
  return num
}

function initRandTables() {
  for (let i = 0; i < 5000; i++) {
    uniformRandTable.push(Math.random());
    gaussianRandTable.push(randomGaussian());
  }
}

initRandTables();

function getUniformRand() {
  let temp = uniformRandIndex;
  uniformRandIndex = (uniformRandIndex == uniformRandTable.length - 1) ? 0 : uniformRandIndex + 1;
  return uniformRandTable[temp];
}

function getGaussianRand() {
  let temp = gaussianRandIndex;
  gaussianRandIndex = (gaussianRandIndex == gaussianRandTable.length - 1) ? 0 : gaussianRandIndex + 1;
  return gaussianRandTable[temp];
}

function generateUniformRandomVectorDemo(w, range) {
  let vtx = [];
  for (let i = 0; i < 100; i++) {
    let y = getUniformRand() * 2 - 1;
    let theta = getUniformRand() * 2 * Math.PI - Math.PI;
    let r = Math.sqrt(1 - Math.pow(y, 2));
    let v = vec3.fromValues(r * Math.cos(theta), y, -r * Math.sin(theta));
    vtx.push(0);
    vtx.push(0);
    vtx.push(0);
    vtx.push(v[0] * 32);
    vtx.push(v[1] * 32);
    vtx.push(v[2] * 32);
  }
  return vtx;
}

function generateUniformRandomVector() {
  let y = getUniformRand() * 2 - 1;
  let theta = getUniformRand() * 2 * Math.PI - Math.PI;
  let r = Math.sqrt(1 - Math.pow(y, 2));
  let v = vec3.fromValues(r * Math.cos(theta), y, -r * Math.sin(theta));
  return v;
}

function generateUniformRandomVectorInRange(w, range) {
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
  return v;
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
