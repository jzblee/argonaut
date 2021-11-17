// Argonaut - GLSL portion
// by Jason Lee

'use strict'

/* eslint-disable no-unused-vars */

const vertexShaderSource = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec4 a_position;
in vec4 a_color;

out vec4 v_position;
out vec4 v_color;
 
// A matrix to transform the positions by
uniform mat4 u_matrix;

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// all shaders have a main function
void main() {
  // Multiply the position by the matrix.
  gl_Position = u_matrix * a_position;
  v_position = gl_Position;
  v_color = a_color;
  gl_PointSize = 5.0;
}
`

const vertexShaderSourceOld = `#version 300 es

// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec3 a_position;

out vec4 u_position;

// Used to pass in the resolution of the canvas
uniform vec3 u_resolution;

// all shaders have a main function
void main() {
  vec3 position = a_position;

  vec3 shiftedPosition = position + 0.5 * u_resolution;

  // convert the rectangle from pixels to 0.0 to 1.0
  vec3 zeroToOne = shiftedPosition / u_resolution;
 
  // convert from 0->1 to 0->2
  vec3 zeroToTwo = zeroToOne * 2.0;
 
  // convert from 0->2 to -1->+1 (clip space)
  vec3 clipSpace = zeroToTwo - 1.0;
 
  // gl_Position is a special variable a vertex shader
  // is responsible for setting
  gl_Position = vec4(clipSpace, 1);
  u_position = gl_Position;
  gl_PointSize = 5.0;
}
`

const fragmentShaderSource = `#version 300 es

// fragment shaders don't have a default precision so we need
// to pick one. highp is a good default. It means "high precision"
precision highp float;

// we need to declare an output for the fragment shader
out vec4 outColor;

in vec4 v_position;
in vec4 v_color;

void main() {
  // Just set the output to a constant redish-purple
  // outColor = vec4(1, 0, 0.5, 1);
  // outColor = v_position * vec4(0, 0, 1, 1);
  // outColor.z = clamp(outColor.z * 2.0, 0.0, 1.0);

  outColor = v_color;
}
`
