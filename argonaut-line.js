// Argonaut - Line portion
// by Jason Lee

// This part of the program is for displaying visualization lines,
// or for implementing simulation lines

// for example, a gravitational attractor may be an infinite
// line, or a finite line segment.

let lines = [];
// the particles portion may add lines here to serve
// as markers for particle attractor locations

// generates line and line segment vertices for display
function generateAllLineVertices(gl) {
    // generate bounding box (hardcoded to the orthographic view so far)
    let sceneBoundingBox = [
        new Plane(vec3.fromValues(-gl.canvas.clientWidth / 16, 0, 0), vec3.fromValues(1, 0, 0)),
        new Plane(vec3.fromValues(gl.canvas.clientWidth / 16, 0, 0), vec3.fromValues(-1, 0, 0)),
        new Plane(vec3.fromValues(0, -gl.canvas.clientWidth / 16, 0), vec3.fromValues(0, 1, 0)),
        new Plane(vec3.fromValues(0, gl.canvas.clientWidth / 16, 0), vec3.fromValues(0, -1, 0)),
        new Plane(vec3.fromValues(0, 0, -gl.canvas.clientWidth / 16), vec3.fromValues(0, 0, 1)),
        new Plane(vec3.fromValues(0, 0, gl.canvas.clientWidth / 16), vec3.fromValues(0, 0, -1))
    ];
    let lineVertices = [];
    lines.forEach(function(line) {
        if (line.isInfinite) {
            let direction = vec3.create();
            vec3.subtract(direction, line.p_1, line.p_0)
            vec3.normalize(direction, direction);
        } else {
            // just display the points
            // you can then cut them off at the bounding box later
            lineVertices.push(line.p_0[0]);
            lineVertices.push(line.p_0[1]);
            lineVertices.push(line.p_0[2]);
            lineVertices.push(line.p_1[0]);
            lineVertices.push(line.p_1[1]);
            lineVertices.push(line.p_1[2]);
        }
    });
    return lineVertices;
}
