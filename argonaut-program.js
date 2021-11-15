// Argonaut - Program portion
// by Jason Lee

"use strict";

let then = 0;

let currentFrame = 0;

let animCall = -1;

let config = null;

// Get the list of configurations and update the dashboard's select item
function generateConfigSelector() {
  let oldConfigSelector = document.getElementById("configSelector");
  let newConfigSelector = document.createElement("select");
  newConfigSelector.id = "configSelector";
  newConfigSelector.className += " form-select";
  newConfigSelector.oninput = loadConfig;
  for (let i = 0; i < configSets.length; i++) {
    let newOption = document.createElement("option");
    newOption.value = i;
    let desc = configSets[i].desc ? configSets[i].desc.data : null;
    newOption.innerText = desc ? desc : "configuration " + i + " (no desc given)";
    newConfigSelector.appendChild(newOption);
  }
  oldConfigSelector = oldConfigSelector.parentNode.replaceChild(newConfigSelector, oldConfigSelector);
}

generateConfigSelector();

// Load the selected configuration and restart the program
function loadConfig() {
  let indexToLoad = document.getElementById("configSelector").value;
  if (indexToLoad >= 0 && indexToLoad < configSets.length) {
    // find a better way to change config rather than just flipping the particle index
    // may also need to change mesh properties, for example
    particleConfigIndex = configSets[indexToLoad].particleConfigIndex.data;

    // these lines are temporary - need to clear out the line buffer and particle buffer
    // when swapping configs. find a better way to do this
    lines = [];
    generatePattCrosses(); // will clear out all the other preset lines! needs fix
    pl_clear();
    destroyExistingCanvas();
    // config = configSets[indexToLoad];
    setUpProgram();
  }
}

loadConfig();

function destroyExistingCanvas() {
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl2");
  if (gl) {
    let newCanvas = document.createElement("canvas");
    newCanvas.id = "c";
    newCanvas.height = HEIGHT;
    newCanvas.width = WIDTH;
    let oldChild = canvas.parentNode.replaceChild(newCanvas, canvas);
  }
}

// Fill the buffer with colors; in this case, normals.
function setColors(gl, buffer, vertices, setAllZero) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  let colors = [];

  for (let i = 0; i < vertices.length; i += 9) {
    let normal = calculateTriangleNormal(
      vec3.fromValues(vertices[i+0], vertices[i+1], vertices[i+2]),
      vec3.fromValues(vertices[i+3], vertices[i+4], vertices[i+5]),
      vec3.fromValues(vertices[i+6], vertices[i+7], vertices[i+8])
    );
    vec3.scaleAndAdd(normal, vec3.fromValues(0.5, 0.5, 0.5), normal, 0.5);
    if (setAllZero) {
      normal = vec3.fromValues(0.0, 0.0, 0.0);
    }
    colors = colors.concat([normal[0], normal[1], normal[2], 1]);
    colors = colors.concat([normal[0], normal[1], normal[2], 1]);
    colors = colors.concat([normal[0], normal[1], normal[2], 1]);
    // colors = colors.concat([r1, g1, b1, 1]);
  }

  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(colors),
      gl.STATIC_DRAW);
}

function setUpProgram() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl2");
  if (!gl) {
    var doc = canvas.ownerDocument;
    const temp = document.createElement("div");
      temp.innerHTML = `
        <div style="
          position: absolute;
          left: 0;
          top: 0;
          background-color: #DEF;
          width: ${parseInt(WIDTH)}px;
          height: ${parseInt(HEIGHT)}px;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-content: center;
          align-items: center;
          padding: 2rem;
        ">
          <div style="text-align: center;">
            Your browser doesn't seem to support WebGL2.<br/>
            If you are using Safari (iOS or macOS), try a) updating Safari to the latest version or b) enabling WebGL 2.0 under Experimental Features.<br/>
            <a href="https://get.webgl.org/webgl2/" target="_blank">Click here for more information.</a>
          </div>
        </div>
      `;
      const div = temp.querySelector('div');
      doc.querySelector('#viewportContainer').appendChild(div);
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromSources(gl,
      [vertexShaderSource, fragmentShaderSource]);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  let locations = {};

  // for (const [uniformName, entry] of Object.entries(config)) {
  //   locations[uniformName] = gl.getUniformLocation(program, uniformName);

  //   if (uniformName === "u_materials") {
  //     console.log("u_materials was defined in the config set, but the values will be overwritten by a dynamically constructed list of just the materials being used.")
  //     continue;
  //   }

  //   if (entry.type === "primitives") {
  //     locations[uniformName] = [];
  //     if (MAX_PRIMITIVES_PER_TYPE < entry.data.length) {
  //       console.warn(`WARNING: maximum size of ${uniformName} exceeded (${MAX_PRIMITIVES_PER_TYPE} allowed), skipping subsequent entries`);
  //     }
  //     for (let i = 0; i < Math.min(MAX_PRIMITIVES_PER_TYPE, entry.data.length); i++) {
  //       let preparedData = {};
  //       // SET UP MATERIAL INFORMATION LOCATIONS
  //       preparedData.materialIndexLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].material_index");
  //       // SET UP PARAMETERS SPECIFIC TO EACH PRMIMITIVE TYPE
  //       if (uniformName === "u_spheres") {
  //         preparedData.pcLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].p_c");
  //         preparedData.rLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].r");
  //         preparedData.n0Location = gl.getUniformLocation(program, uniformName + "[" + i + "].n_0");
  //         preparedData.n2Location = gl.getUniformLocation(program, uniformName + "[" + i + "].n_2");
  //         preparedData.isHollowLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].is_hollow");
  //       } else if (uniformName === "u_planes") {
  //         preparedData.piLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].p_i");
  //         preparedData.niLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].n_i");
  //         preparedData.vUpLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].v_up");
  //         preparedData.s0Location = gl.getUniformLocation(program, uniformName + "[" + i + "].s_0");
  //         preparedData.s1Location = gl.getUniformLocation(program, uniformName + "[" + i + "].s_1");
  //       }
  //       locations[uniformName].push(preparedData);
  //     }
  //   }
  //   if (entry.type === "lights") {
  //     locations[uniformName] = [];
  //     if (MAX_LIGHTS_PER_TYPE < entry.data.length) {
  //       console.warn(`WARNING: maximum size of ${uniformName} exceeded (${MAX_LIGHTS_PER_TYPE} allowed), skipping subsequent entries`);
  //     }
  //     for (let i = 0; i < Math.min(MAX_LIGHTS_PER_TYPE, entry.data.length); i++) {
  //       let preparedData = {
  //         // SET UP MATERIAL INFORMATION LOCATIONS
  //         materialIndexLocation: gl.getUniformLocation(program, uniformName + "[" + i + "].material_index")
  //       };
  //       // SET UP PARAMETERS SPECIFIC TO EACH LIGHT TYPE
  //       if (uniformName === "u_directional_lights") {
  //         preparedData.nlLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].n_l");
  //       } else if (uniformName === "u_point_lights") {
  //         preparedData.plLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].p_l");
  //       } else if (uniformName === "u_spot_lights") {
  //         preparedData.plLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].p_l");
  //         preparedData.thetaLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].theta");
  //         preparedData.nl0Location = gl.getUniformLocation(program, uniformName + "[" + i + "].n_l0");
  //       } else if (uniformName === "u_rect_lights") {
  //         preparedData.pcLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].p_c");
  //         preparedData.nlLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].n_l");
  //         preparedData.vupLocation = gl.getUniformLocation(program, uniformName + "[" + i + "].v_up");
  //         preparedData.s0Location = gl.getUniformLocation(program, uniformName + "[" + i + "].s_0");
  //         preparedData.s1Location = gl.getUniformLocation(program, uniformName + "[" + i + "].s_1");
  //       }
  //       locations[uniformName].push(preparedData);
  //     }
  //   }
  //   if (entry.type === "triangles" && uniformName === "u_triangles") {
  //     // conditioned on both the entry type and the uniform name u_triangles,
  //     // since there should only be one triangle uniform array anyway

  //     locations[uniformName] = [];
  //     let numTris = 0;
  //     for (let h = 0; h < entry.data.length; h++) {
  //       for (let i = 0; i < entry.data[h].position.length / 9; i++) {
  //         if (numTris > MAX_TRIANGLES) {
  //           console.warn(`WARNING: maximum size of ${uniformName} exceeded (${MAX_TRIANGLES} allowed), skipping subsequent entries`);
  //           break;
  //         }
  //         let preparedData = {};
  //         preparedData.p0Location = gl.getUniformLocation(program, uniformName + "[" + numTris + "].p_0");
  //         preparedData.p1Location = gl.getUniformLocation(program, uniformName + "[" + numTris + "].p_1");
  //         preparedData.p2Location = gl.getUniformLocation(program, uniformName + "[" + numTris + "].p_2");
  //         preparedData.p0TexLocation = gl.getUniformLocation(program, uniformName + "[" + numTris + "].p_0_tex");
  //         preparedData.p1TexLocation = gl.getUniformLocation(program, uniformName + "[" + numTris + "].p_1_tex");
  //         preparedData.p2TexLocation = gl.getUniformLocation(program, uniformName + "[" + numTris + "].p_2_tex");
  //         preparedData.materialIndexLocation = gl.getUniformLocation(program, uniformName + "[" + numTris + "].material_index");
  //         locations[uniformName].push(preparedData);
  //         numTris++;
  //       }
  //     }
  //   }
  //   if (entry.type === "animation" && uniformName === "u_animation") {
  //     // DONT HANDLE ANIMATION HERE, see advanceFrame event
  //   }
  // }

  gl.canvas.addEventListener('confirmSettings', (e) => {
    initialState.windSpeed = vec2.fromValues(e.detail.windSpeedX, e.detail.windSpeedY);
    animCall = -1;
    pl_clear();
    simOut = simulate();
    animCall = requestAnimationFrame(drawScene);
  });

  var spherePositionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer);
  let sphereVertices = generateSphereVertices(vec3.fromValues(0.0, 0.0, 0.0), initialState.sphere.radius, 16, 24);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertices), gl.STATIC_DRAW);

  // Create a buffer for the colors.
  var sphereColorBuffer = gl.createBuffer();
  // Set the colors.
  setColors(gl, sphereColorBuffer, sphereVertices);

  var envboxPositionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, envboxPositionBuffer);
  // kludge fix for the time being to generate the disc using the envbox buffer
  let envboxVertices = generateTriangleFanVertices(vec3.fromValues(0,0,0), vec3.fromValues(0, 0, -1), 24.0, 32);
  // let envboxVertices = generateBox(20, 20, 12.5, Math.PI / 6);
  // let envboxVertices = generateBox(20, 10, 12.5, 0);
  for (let i = 0; i < envboxVertices.length; i += 9) {
    envboxTriangles.push(new Triangle(
      vec3.fromValues(envboxVertices[i],envboxVertices[i+1],envboxVertices[i+2]),
      vec3.fromValues(envboxVertices[i+3],envboxVertices[i+4],envboxVertices[i+5]),
      vec3.fromValues(envboxVertices[i+6],envboxVertices[i+7],envboxVertices[i+8])));
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(envboxVertices), gl.STATIC_DRAW);

  // Create a buffer for the colors.
  var envboxColorBuffer = gl.createBuffer();
  // Set the colors.
  setColors(gl, envboxColorBuffer, envboxVertices);

  var linePositionBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, linePositionBuffer);
  let lineVertices = generateAllLineVertices(gl);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);

  var lineColorBuffer = gl.createBuffer();
  setColors(gl, lineColorBuffer, lineVertices, true);

  var particlePositionBuffer = gl.createBuffer();

  // particle position buffer is handled in draw loop

  // Create a buffer for the colors.
  var particleColorBuffer = gl.createBuffer();
  // color settings are handled in draw loop

  simOut = simulate();

  animCall = requestAnimationFrame(drawScene);
  let t_x = 0.0, t_y = 0.0, t_z = 0.0;

  function drawScene(now) {
    let fps = simOut.fps;
    let maxFrame = simOut.maxFrame;

    let spherePositions = simOut.spherePositions;
    let sphereVelocities = simOut.sphereVelocities;

    let particlePositions = simOut.particlePositions;
    let particleColors = simOut.particleColors;

    now *= 0.001;
    var deltaTime = now - then;
    then = now;
    let frame = Math.floor(now * fps) % maxFrame;
    // console.log(frame, particlePositions[frame]);
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST);

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    for (let i = 2; i < 4; i++) {  // SKIP ALL BUT PARTICLES FOR NOW
      // Bind the attribute/buffer set we want.
      let vao = null;
      let positionBuffer = null;
      let colorBuffer = null;
      let numVertices = null;
      let primitiveType = null;
      switch(i) {
        case 0:
        // CASE 0: bouncing sphere (gravity simulation and collisions)
        vao = gl.createVertexArray();
        positionBuffer = spherePositionBuffer;
        colorBuffer = sphereColorBuffer;
        numVertices = sphereVertices.length / 3;
        primitiveType = gl.TRIANGLES;
        break;
        case 1:
        // CASE 1: environment box (collisions)
        vao = gl.createVertexArray();;
        positionBuffer = envboxPositionBuffer;
        colorBuffer = envboxColorBuffer;
        numVertices = envboxVertices.length / 3;
        primitiveType = gl.POINTS;
        break;
        case 2:
        // CASE 2: line visualization (point trails or particle choreography)
        vao = gl.createVertexArray();;
        positionBuffer = linePositionBuffer;
        colorBuffer = lineColorBuffer;
        numVertices = lineVertices.length / 3;
        primitiveType = gl.LINES;
        break;
        case 3:
        // CASE 3: particle simulation (gravity, wind, air resistance)
        vao = gl.createVertexArray();;
        positionBuffer = particlePositionBuffer;
        colorBuffer = particleColorBuffer;
        numVertices = particlePositions[frame].length / 3;
        primitiveType = gl.POINTS;

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particlePositions[frame]), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleColors[frame]), gl.STATIC_DRAW);
        break;
        default:
        break;
      }
      gl.bindVertexArray(vao);

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      gl.enableVertexAttribArray(positionAttributeLocation);
      var size = 3;
      var type = gl.FLOAT;
      var normalize = false;
      var stride = 0;
      var offset = 0;
      gl.vertexAttribPointer(
          positionAttributeLocation, size, type, normalize, stride, offset);

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
      
      gl.enableVertexAttribArray(colorAttributeLocation);
      var size = 4;
      var type = gl.FLOAT;
      var normalize = false;
      var stride = 0;
      var offset = 0;
      gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);

      var matrix = mat4.create();
      mat4.ortho(matrix,
        -gl.canvas.clientWidth / 16, gl.canvas.clientWidth / 16,
        -gl.canvas.clientHeight / 16, gl.canvas.clientHeight / 16,
        -gl.canvas.clientWidth / 16, gl.canvas.clientWidth / 16);
      if (i == 0){
        // let frame = Math.floor(now * fps) % maxFrame;  // moved to top of function
        mat4.translate(matrix, matrix, vec3.fromValues(spherePositions[frame][0], spherePositions[frame][1], spherePositions[frame][2]));
      }

      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // var primitiveType = i == 2 ? gl.LINES : gl.TRIANGLES;
      var offset = 0;
      var count = numVertices;
      gl.drawArrays(primitiveType, offset, count);
    }

    if (animCall != -1) {
      animCall = requestAnimationFrame(drawScene);
    } else {
      animCall = -2;
    }
  }
}
