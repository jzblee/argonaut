=========================
Argonaut - a graphics system implementing physically based modeling
Name: Jason Lee
=========================

    Website: TBD

=====================
System description:
=====================

    Argonaut is adapted from the raytracer I wrote for Ergun Akleman's Image Synthesis course. My goal is to use my existing scene graph, timestep, and web interaction capabilities to deliver reasonably fast physics simulations.

    To help with development I split the program into several files. For reference, they are:

    types.js - declaring all of the primitive/light object types in both JS and GLSL
    objdata.js - declaring data structures derived from a few preprocessed OBJ files for several test cases and platonic solids
    config.js - contains all of the texture/material declarations and configuration sets for each scene
    glsl.js - contains the GLSL code and any dynamic shader code generation
    program.js - assembles the GLSL program within JS, and sets up all of the program uniforms

=======================
Operating instructions:
=======================

    Access the demo by creating a webserver in the current working directory:

    $ python -m SimpleHTTPServer
    $ python3 -m http.server

    Then visit http://localhost:8000 to view a local copy of my project site, including the demo.

    Additionally, the rendering and image export function of the demo runs on a NodeJS server. You can run the image server concurrently by running the following:

    $ node imageserver.js

    If the exportImageSequence flag is set to true in program.js, the page will automatically start rendering the entire image sequence when the page loads. Any rendered images will be written to the project folder. If the flag is false, you can review individual frames in the sequence by clicking the Advance frame button (no frames are exported).

    As I explained in past project readme files, the demo may be too resource-intensive for some machines. I included images and videos with the submission as a backup.

    In Safari on macOS and iOS, WebGL2 needs to be enabled under Experimental Features.

    On Google Chrome, you may need to enable hardware acceleration in Settings and ignore the GPU blocklist on the Experimental Flags screen for GPU support.

===============
Libraries used:
===============

    `gl-matrix-min.js` - matrix and vector operation library
    `webgl-utils.js` - WebGL loading/linking library by Gregg Tavares
    Bootstrap - for UI
