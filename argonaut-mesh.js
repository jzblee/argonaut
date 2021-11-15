// Argonaut - Mesh portion
// by Jason Lee

"use strict";

function generateBox(x, y, z, rotateY) {
  let vertices = [
    x,y,z,
    -x,y,z,
    x,-y,z,
    x,-y,z,
    -x,y,z,
    -x,-y,z,
    -x,y,-z,
    x,y,-z,
    -x,-y,-z,
    -x,-y,-z,
    x,y,-z,
    x,-y,-z,
    -x,-y,z,  // first bottom face tri
    -x,-y,-z,
    x,-y,z,
    x,-y,z,
    -x,-y,-z,
    x,-y,-z,  // last bottom face tri
    x,y,z,
    x,y,-z,
    -x,y,z,
    -x,y,z,
    x,y,-z,
    -x,y,-z,
    -x,-y,z,
    -x,y,z,
    -x,-y,-z,
    -x,-y,-z,
    -x,y,z,
    -x,y,-z,
    x,-y,z,
    x,-y,-z,
    x,y,z,
    x,y,z,
    x,-y,-z,
    x,y,-z
  ]

  // Does a test transformation on all vertices
  for (let i = 0; i < vertices.length; i += 3) {
    let p = vec3.fromValues(vertices[i + 0], vertices[i + 1], vertices[i + 2]);
    vec3.rotateY(p, p, vec3.create(), rotateY);
    vec3.rotateX(p, p, vec3.create(), rotateY/2);
    // vec3.rotateZ(p, p, vec3.create(), rotateY/4);
    vertices[i + 0] = p[0];
    vertices[i + 1] = p[1];
    vertices[i + 2] = p[2];
  }
  // reverses each face to allow for backface culling by WebGL
  for (let i = 0; i < vertices.length; i += 9) {
    let p1_x_temp = vertices[i + 3];
    let p1_y_temp = vertices[i + 4];
    let p1_z_temp = vertices[i + 5];
    vertices[i + 3] = vertices[i + 6];
    vertices[i + 4] = vertices[i + 7];
    vertices[i + 5] = vertices[i + 8];
    vertices[i + 6] = p1_x_temp;
    vertices[i + 7] = p1_y_temp;
    vertices[i + 8] = p1_z_temp;
  }
  return vertices;
}

/*
  Generates a disc using triangle fan. Redefines coordinate frame of vertices
  according to the provided normal vector.
*/
function generateTriangleFanVertices(p_c, n_i, radius, subdivisionsY) {
  // create vertex array to hold center and each of the vertices along the rim
  let vtx = [];

  let scale = mat4.fromValues(
    radius, 0.0,    0.0,    0.0,
    0.0,    radius, 0.0,    0.0,
    0.0,    0.0,    radius, 0.0,
    0.0,    0.0,    0.0,    1.0
  );
  let rotation = getRotationMatrix(n_i);
  let translate = mat4.fromValues(
    1.0,    0.0,    0.0,    0.0,
    0.0,    1.0,    0.0,    0.0,
    0.0,    0.0,    1.0,    0.0,
    p_c[0], p_c[1], p_c[2], 1.0
  );

  // note: when multiplying transformation matrices, they need to be multiplied
  // in REVERSE ORDER
  let transform = mat4.create();
  mat4.multiply(transform, translate, rotation);
  mat4.multiply(transform, transform, scale);

  // Generate the vertices on the rim of the disc
  for (let i = 0; i < subdivisionsY; i++) {
    let rot = i / subdivisionsY * 2 * Math.PI;
    let pointVec = vec3.fromValues(1, 0, 0);
    vec3.rotateZ(pointVec, pointVec, vec3.create(), rot);
    vec3.transformMat4(pointVec, pointVec, transform);
    vtx.push(pointVec[0]);
    vtx.push(pointVec[1]);
    vtx.push(pointVec[2]);
  }

  let faceComponents = [];

  // generate each of the faces for the trangles, in counterclockwise order
  for (let i = 0; i < subdivisionsY; i++) {
    let i_successor = i < subdivisionsY - 1 ? i + 1 : 0;
    faceComponents.push(p_c[0]);
    faceComponents.push(p_c[1]);
    faceComponents.push(p_c[2]);
    faceComponents.push(vtx[3*i_successor+0]);
    faceComponents.push(vtx[3*i_successor+1]);
    faceComponents.push(vtx[3*i_successor+2]);
    faceComponents.push(vtx[3*i+0]);
    faceComponents.push(vtx[3*i+1]);
    faceComponents.push(vtx[3*i+2]);
  }

  return faceComponents;
}

// TODO: implement backface culling for missing sphere faces
function generateSphereVertices(p_c, radius, subdivisionsZ, subdivisionsY) {
  // p_c, radius, subdivisionsZ, subdivisionsY

  // at zero rotation:
  // n0 = (1, 0, 0)
  // n1 = (0, 1, 0)
  // n2 = (0, 0, 1)

  // contains all the non-pole vertices (poles handled separately)
  let vtx = [];

  // find the north pole
  let north_pole = vec3.fromValues(radius, 0.0, 0.0);
  vec3.rotateZ(north_pole, north_pole, vec3.create(), Math.PI / 2.0);
  vec3.add(north_pole, p_c, north_pole);

  for (let i = 1; i < subdivisionsZ; i++) {
    for (let j = 1; j <= subdivisionsY; j++) {
      let new_vertex = vec3.fromValues(radius, 0.0, 0.0);
      // ROTATE BY Z THEN ROTATE BY Y
      let rotateY = j / subdivisionsY * 2 * Math.PI;
      let rotateZ = i / subdivisionsZ * Math.PI - Math.PI / 2.0;
      vec3.rotateZ(new_vertex, new_vertex, vec3.create(), rotateZ)
      vec3.rotateY(new_vertex, new_vertex, vec3.create(), rotateY);
      vec3.add(new_vertex, p_c, new_vertex);
      vtx.push(new_vertex[0]);
      vtx.push(new_vertex[1]);
      vtx.push(new_vertex[2]);
    }
  }

  // find the south pole
  let south_pole = vec3.fromValues(radius, 0.0, 0.0);
  vec3.rotateZ(south_pole, south_pole, vec3.create(), -Math.PI / 2.0);
  vec3.add(south_pole, p_c, south_pole);

  let faceComponents = [];

  for (let i = 0; i <= subdivisionsZ; i++) {
    // if we're at the top or bottom horizontal subdivision, a pole is involved
    if (i == 0 || i == subdivisionsZ) {
      let pole = i == 0 ? south_pole : north_pole;
      let newI = i == 0 ? 0 : i - 2;
      let p1_shift = newI == 0 ? 1 : 0;
      let p2_shift = newI == 0 ? 0 : 1;
      // draw cap faces, and switch order based on whether covering north or south poles
      // each triangles in the sphere caps consists of a pair of neighboring non-pole vertices
      // and that cap's pole
      for (let j = 0; j < subdivisionsY; j++) {
        let capJoinIndex = newI * subdivisionsY + j;
        let p1_idx = j == subdivisionsY - 1 ? 0 : 3 * (capJoinIndex + p1_shift);
        let p2_idx = j == subdivisionsY - 1 ? 0 : 3 * (capJoinIndex + p2_shift);
        faceComponents = faceComponents.concat([pole[0], pole[1], pole[2]]);
        faceComponents = faceComponents.concat([vtx[p1_idx], vtx[p1_idx + 1], vtx[p1_idx + 2]]);
        faceComponents = faceComponents.concat([vtx[p2_idx], vtx[p2_idx + 1], vtx[p2_idx + 2]]);
      }
    } else {
      // draw non-cap faces
      // calculate correct indices for the ponits of a quad;
      // split it into 2 triangles
      for (let j = 0; j < subdivisionsY; j++) {
        let p1_idx = (i - 1) * subdivisionsY + j;
        let p2_idx = (i - 1) * subdivisionsY + j + 1;
        let p3_idx = i * subdivisionsY + j;
        let p4_idx = i * subdivisionsY + j + 1;

        // since the y-subdivisions (i.e. "lines of longitude")
        // loop around, need to adjust indices for some points
        // accordingly to avoid out-of-range errors
        p2_idx = j == subdivisionsY - 1 ? 0 : p2_idx;
        p4_idx = j == subdivisionsY - 1 ? 0 : p4_idx;

        // multiply indices by 3 to account for each vertex taking
        // up 3 array slots (x,y,z)
        p1_idx *= 3;
        p2_idx *= 3;
        p3_idx *= 3;
        p4_idx *= 3;

        // add the vertices for two triangles that make up the
        // previously generated sphere quads
        faceComponents = faceComponents.concat([vtx[p1_idx], vtx[p1_idx + 1], vtx[p1_idx + 2]]);
        faceComponents = faceComponents.concat([vtx[p2_idx], vtx[p2_idx + 1], vtx[p2_idx + 2]]);
        faceComponents = faceComponents.concat([vtx[p3_idx], vtx[p3_idx + 1], vtx[p3_idx + 2]]);
        faceComponents = faceComponents.concat([vtx[p2_idx], vtx[p2_idx + 1], vtx[p2_idx + 2]]);
        faceComponents = faceComponents.concat([vtx[p4_idx], vtx[p4_idx + 1], vtx[p4_idx + 2]]);
        faceComponents = faceComponents.concat([vtx[p3_idx], vtx[p3_idx + 1], vtx[p3_idx + 2]]);
      }
    }
  }

  return faceComponents;
}
