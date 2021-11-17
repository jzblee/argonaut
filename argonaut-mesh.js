// Argonaut - Mesh portion
// by Jason Lee

'use strict'

/* global vec3, mat4, getRotationMatrix */

function generateBox (x, y, z, rotateY) { // eslint-disable-line no-unused-vars
  const vertices = [
    x, y, z,
    -x, y, z,
    x, -y, z,
    x, -y, z,
    -x, y, z,
    -x, -y, z,
    -x, y, -z,
    x, y, -z,
    -x, -y, -z,
    -x, -y, -z,
    x, y, -z,
    x, -y, -z,
    -x, -y, z, // first bottom face tri
    -x, -y, -z,
    x, -y, z,
    x, -y, z,
    -x, -y, -z,
    x, -y, -z, // last bottom face tri
    x, y, z,
    x, y, -z,
    -x, y, z,
    -x, y, z,
    x, y, -z,
    -x, y, -z,
    -x, -y, z,
    -x, y, z,
    -x, -y, -z,
    -x, -y, -z,
    -x, y, z,
    -x, y, -z,
    x, -y, z,
    x, -y, -z,
    x, y, z,
    x, y, z,
    x, -y, -z,
    x, y, -z
  ]

  // Does a test transformation on all vertices
  for (let i = 0; i < vertices.length; i += 3) {
    const p = vec3.fromValues(vertices[i + 0], vertices[i + 1], vertices[i + 2])
    vec3.rotateY(p, p, vec3.create(), rotateY)
    vec3.rotateX(p, p, vec3.create(), rotateY / 2)
    // vec3.rotateZ(p, p, vec3.create(), rotateY/4);
    vertices[i + 0] = p[0]
    vertices[i + 1] = p[1]
    vertices[i + 2] = p[2]
  }
  // reverses each face to allow for backface culling by WebGL
  for (let i = 0; i < vertices.length; i += 9) {
    const p1XTemp = vertices[i + 3]
    const p1YTemp = vertices[i + 4]
    const p1ZTemp = vertices[i + 5]
    vertices[i + 3] = vertices[i + 6]
    vertices[i + 4] = vertices[i + 7]
    vertices[i + 5] = vertices[i + 8]
    vertices[i + 6] = p1XTemp
    vertices[i + 7] = p1YTemp
    vertices[i + 8] = p1ZTemp
  }
  return vertices
}

/*
  Generates a disc using triangle fan. Redefines coordinate frame of vertices
  according to the provided normal vector.
*/
/* eslint-disable no-unused-vars */
function generateTriangleFanVertices (pC, nI, radius, subdivisionsY) {
  /* eslint-enable no-unused-vars */
  // create vertex array to hold center and each of the vertices along the rim
  const vtx = []

  const scale = mat4.fromValues(
    radius, 0.0, 0.0, 0.0,
    0.0, radius, 0.0, 0.0,
    0.0, 0.0, radius, 0.0,
    0.0, 0.0, 0.0, 1.0
  )
  const rotation = getRotationMatrix(nI)
  const translate = mat4.fromValues(
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    pC[0], pC[1], pC[2], 1.0
  )

  // note: when multiplying transformation matrices, they need to be multiplied
  // in REVERSE ORDER
  const transform = mat4.create()
  mat4.multiply(transform, translate, rotation)
  mat4.multiply(transform, transform, scale)

  // Generate the vertices on the rim of the disc
  for (let i = 0; i < subdivisionsY; i++) {
    const rot = i / subdivisionsY * 2 * Math.PI
    const pointVec = vec3.fromValues(1, 0, 0)
    vec3.rotateZ(pointVec, pointVec, vec3.create(), rot)
    vec3.transformMat4(pointVec, pointVec, transform)
    vtx.push(pointVec[0])
    vtx.push(pointVec[1])
    vtx.push(pointVec[2])
  }

  const faceComponents = []

  // generate each of the faces for the trangles, in counterclockwise order
  for (let i = 0; i < subdivisionsY; i++) {
    const iSuccessor = i < subdivisionsY - 1 ? i + 1 : 0
    faceComponents.push(pC[0])
    faceComponents.push(pC[1])
    faceComponents.push(pC[2])
    faceComponents.push(vtx[3 * iSuccessor + 0])
    faceComponents.push(vtx[3 * iSuccessor + 1])
    faceComponents.push(vtx[3 * iSuccessor + 2])
    faceComponents.push(vtx[3 * i + 0])
    faceComponents.push(vtx[3 * i + 1])
    faceComponents.push(vtx[3 * i + 2])
  }

  return faceComponents
}

// TODO: implement backface culling for missing sphere faces

/* eslint-disable no-unused-vars */
function generateSphereVertices (pC, radius, subdivisionsZ, subdivisionsY) {
  /* eslint-enable no-unused-vars */
  // pC, radius, subdivisionsZ, subdivisionsY

  // at zero rotation:
  // n0 = (1, 0, 0)
  // n1 = (0, 1, 0)
  // n2 = (0, 0, 1)

  // contains all the non-pole vertices (poles handled separately)
  const vtx = []

  // find the north pole
  const northPole = vec3.fromValues(radius, 0.0, 0.0)
  vec3.rotateZ(northPole, northPole, vec3.create(), Math.PI / 2.0)
  vec3.add(northPole, pC, northPole)

  for (let i = 1; i < subdivisionsZ; i++) {
    for (let j = 1; j <= subdivisionsY; j++) {
      const newVertex = vec3.fromValues(radius, 0.0, 0.0)
      // ROTATE BY Z THEN ROTATE BY Y
      const rotateY = j / subdivisionsY * 2 * Math.PI
      const rotateZ = i / subdivisionsZ * Math.PI - Math.PI / 2.0
      vec3.rotateZ(newVertex, newVertex, vec3.create(), rotateZ)
      vec3.rotateY(newVertex, newVertex, vec3.create(), rotateY)
      vec3.add(newVertex, pC, newVertex)
      vtx.push(newVertex[0])
      vtx.push(newVertex[1])
      vtx.push(newVertex[2])
    }
  }

  // find the south pole
  const southPole = vec3.fromValues(radius, 0.0, 0.0)
  vec3.rotateZ(southPole, southPole, vec3.create(), -Math.PI / 2.0)
  vec3.add(southPole, pC, southPole)

  let faceComponents = []

  for (let i = 0; i <= subdivisionsZ; i++) {
    // if we're at the top or bottom horizontal subdivision, a pole is involved
    if (i === 0 || i === subdivisionsZ) {
      const pole = i === 0 ? southPole : northPole
      const newI = i === 0 ? 0 : i - 2
      const p1Shift = newI === 0 ? 1 : 0
      const p2Shift = newI === 0 ? 0 : 1
      // draw cap faces, and switch order based on whether covering north or south poles
      // each triangles in the sphere caps consists of a pair of neighboring non-pole vertices
      // and that cap's pole
      for (let j = 0; j < subdivisionsY; j++) {
        const capJoinIndex = newI * subdivisionsY + j
        const p1Idx = j === subdivisionsY - 1 ? 0 : 3 * (capJoinIndex + p1Shift)
        const p2Idx = j === subdivisionsY - 1 ? 0 : 3 * (capJoinIndex + p2Shift)
        faceComponents = faceComponents.concat([pole[0], pole[1], pole[2]])
        faceComponents = faceComponents.concat([vtx[p1Idx], vtx[p1Idx + 1], vtx[p1Idx + 2]])
        faceComponents = faceComponents.concat([vtx[p2Idx], vtx[p2Idx + 1], vtx[p2Idx + 2]])
      }
    } else {
      // draw non-cap faces
      // calculate correct indices for the ponits of a quad;
      // split it into 2 triangles
      for (let j = 0; j < subdivisionsY; j++) {
        let p1Idx = (i - 1) * subdivisionsY + j
        let p2Idx = (i - 1) * subdivisionsY + j + 1
        let p3Idx = i * subdivisionsY + j
        let p4Idx = i * subdivisionsY + j + 1

        // since the y-subdivisions (i.e. "lines of longitude")
        // loop around, need to adjust indices for some points
        // accordingly to avoid out-of-range errors
        p2Idx = j === subdivisionsY - 1 ? 0 : p2Idx
        p4Idx = j === subdivisionsY - 1 ? 0 : p4Idx

        // multiply indices by 3 to account for each vertex taking
        // up 3 array slots (x,y,z)
        p1Idx *= 3
        p2Idx *= 3
        p3Idx *= 3
        p4Idx *= 3

        // add the vertices for two triangles that make up the
        // previously generated sphere quads
        faceComponents = faceComponents.concat([vtx[p1Idx], vtx[p1Idx + 1], vtx[p1Idx + 2]])
        faceComponents = faceComponents.concat([vtx[p2Idx], vtx[p2Idx + 1], vtx[p2Idx + 2]])
        faceComponents = faceComponents.concat([vtx[p3Idx], vtx[p3Idx + 1], vtx[p3Idx + 2]])
        faceComponents = faceComponents.concat([vtx[p2Idx], vtx[p2Idx + 1], vtx[p2Idx + 2]])
        faceComponents = faceComponents.concat([vtx[p4Idx], vtx[p4Idx + 1], vtx[p4Idx + 2]])
        faceComponents = faceComponents.concat([vtx[p3Idx], vtx[p3Idx + 1], vtx[p3Idx + 2]])
      }
    }
  }

  return faceComponents
}
