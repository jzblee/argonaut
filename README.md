# Argonaut - physically based modeling techniques in WebGL

Website: https://www.jzblee.com/argonaut/

## System description

Argonaut is adapted from the raytracer I wrote for Dr. Ergun Akleman's Image Synthesis course in spring 2021. My goal is to use my existing scene graph, timestep, and web interaction capabilities to deliver reasonably fast physics simulations.

To help with development I split the program into several files. For reference, they are:

- `config.js` - contains most of the basic global parameters as well as overall configuration sets for each scene
- `types.js` - declares all of the custom object types in JS
- `random.js` - includes functions to generate tables of numbers that follow uniform and Gaussian distributions, as well as random vectors
- `matops.js` - includes functions that operate on matrices or vectors, such as rotation into a coordinate frame or calculating triangle normals
- `line.js` - includes code to generate and render lines in the applet
- `particle.js` - handles the particle system logic and particle-specific scene configurations
- `mesh.js` - provides functions to generate triangle meshes for cubes, spheres, or triangle fans as needed
- `glsl.js` - contains simple GLSL code (vertex and fragment shader) for rendering to the WebGL canvas
- `rigidbody.js` - contains functions related to the rigid body dynamics solver
- `simulation.js` - runs the physics simulation based on the configuration, handles bouncing ball collision and response
- `dashboard.js` - includes functions related to the interface dashboard and interactively setting parameters
- `program.js` - assembles the GLSL program within JS, properly initializes all of the buffers for each type of object being rendered, and handles animation

## Operating instructions

Access the simulator by creating a webserver in this directory:

    $ python -m SimpleHTTPServer
    $ python3 -m http.server

Then visit http://localhost:8000 to view a local copy of Argonaut.

In versions of Safari (macOS and iOS) before 15.0, WebGL 2.0 needs to be enabled under Experimental Features.

On Google Chrome, you may need to enable hardware acceleration in Settings and ignore the GPU blocklist on the Experimental Flags screen for GPU support.

## Libraries used

- `gl-matrix-min.js` - matrix and vector operation library
- `webgl-utils.js` - WebGL loading/linking library
- Bootstrap - for UI

## Credits

Created by Jason Lee for an independent study on physically-based modeling at TAMU in fall 2021.

Thanks to Dr. Donald House, Dr. John Keyser, Sarah Beth Eisinger, Bailey Currie, and Katy Callaway for assistance throughout!
