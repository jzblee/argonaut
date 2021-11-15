// Argonaut - Types portion
// by Jason Lee

"use strict";

/*
 * I lifted several object schemas from the types class and simplified
 * them for this first exercise
 */
function Sphere(position, velocity, acceleration, radius)
{
  this.position = position;
  this.velocity = velocity;
  this.acceleration = acceleration;
  this.radius = radius;
}

function Plane(p_i, n_i)
{
  this.p_i = p_i;
  this.n_i = n_i;
}

function Line(p_0, p_1, isInfinite)
{
  this.p_0 = p_0;
  this.p_1 = p_1;
  this.isInfinite = isInfinite;
}

function PointAttractor(point, mass, power)
{
  this.point = point;
  this.mass = mass;
  this.power = power;
}

function LineAttractor(line, mass, power)
{
  this.line = line;
  this.mass = mass;
  this.power = power;
}

function Triangle(p_0, p_1, p_2)
{
  this.p_0 = p_0;
  this.p_1 = p_1;
  this.p_2 = p_2;
  this.n_i = vec3.create();
  let v_0 = vec3.create();
  let v_1 = vec3.create();
  vec3.subtract(v_0, p_1, p_0);
  vec3.subtract(v_1, p_2, p_0);
  vec3.cross(this.n_i, v_0, v_1);
  vec3.normalize(this.n_i, this.n_i);
  this.center = vec3.create();
  vec3.add(this.center, this.center, this.p_0);
  vec3.add(this.center, this.center, this.p_1);
  vec3.add(this.center, this.center, this.p_2);
  vec3.scale(this.center, this.center, 1 / 3);
};
