// Argonaut - Program portion
// by Jason Lee

'use strict'

/* eslint-disable no-global-assign */
/* eslint-disable no-unused-vars */

/* globals configSets, particleConfigIndex,
lines, generatePattCrosses, plClear, vec3,
HEIGHT, WIDTH, calculateTriangleNormal, webglUtils,
vertexShaderSource, fragmentShaderSource, initialState,
vec2, simOut, simulate, requestAnimationFrame,
generateSphereVertices, generateTriangleFanVertices,
envboxTriangles, Triangle, generateAllLineVertices,
mat4, configIndex, rbdStates, cubeObj, rbdCollisionPlaneHeight */

/* eslint-enable no-unused-vars */

let animCall = -1

// Get the list of configurations and update the dashboard's select item
function generateConfigSelector () {
  const oldConfigSelector = document.getElementById('configSelector')
  const newConfigSelector = document.createElement('select')
  newConfigSelector.id = 'configSelector'
  newConfigSelector.className += ' form-select'
  newConfigSelector.oninput = loadConfig
  for (let i = 0; i < configSets.length; i++) {
    const newOption = document.createElement('option')
    newOption.value = i
    const desc = configSets[i].desc ? configSets[i].desc.data : null
    newOption.innerText = desc || 'configuration ' + i + ' (no desc given)'
    newConfigSelector.appendChild(newOption)
  }
  oldConfigSelector.parentNode.replaceChild(newConfigSelector, oldConfigSelector)
}

generateConfigSelector()

// force the applet to load a specific config index on page load (0 by default)
// document.getElementById('configSelector').value = 2

// Load the selected configuration and restart the program
function loadConfig () {
  const indexToLoad = document.getElementById('configSelector').value
  if (indexToLoad >= 0 && indexToLoad < configSets.length) {
    configIndex = indexToLoad
    // find a better way to change config rather than just flipping the particle index
    // may also need to change mesh properties, for example
    particleConfigIndex = configSets[indexToLoad].particleConfigIndex.data

    // these lines are temporary - need to clear out the line buffer and particle buffer
    // when swapping configs. find a better way to do this
    lines = []
    generatePattCrosses() // will clear out all the other preset lines! needs fix
    plClear()
    destroyExistingCanvas()
    // config = configSets[indexToLoad];
    // rbdStates = [] // kludge for now, keep the RBD states around and don't delete them to avoid having to regen (just one example right now) TODO
    setUpProgram()
  }
}

loadConfig()

function destroyExistingCanvas () {
  const canvas = document.querySelector('#c')
  const gl = canvas.getContext('webgl2')
  if (gl) {
    const newCanvas = document.createElement('canvas')
    newCanvas.id = 'c'
    newCanvas.height = HEIGHT
    newCanvas.width = WIDTH
    canvas.parentNode.replaceChild(newCanvas, canvas)
  }
}

// Fill the buffer with colors; in this case, normals.
function setColors (gl, buffer, vertices, setAllZero) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

  let colors = []

  for (let i = 0; i < vertices.length; i += 9) {
    let normal = calculateTriangleNormal(
      vec3.fromValues(vertices[i + 0], vertices[i + 1], vertices[i + 2]),
      vec3.fromValues(vertices[i + 3], vertices[i + 4], vertices[i + 5]),
      vec3.fromValues(vertices[i + 6], vertices[i + 7], vertices[i + 8])
    )
    vec3.scaleAndAdd(normal, vec3.fromValues(0.5, 0.5, 0.5), normal, 0.5)
    if (setAllZero) {
      normal = darkModeEnabled ? vec3.fromValues(0.9, 0.9, 0.9) : vec3.fromValues(0.1, 0.1, 0.1)
    }
    colors = colors.concat([normal[0], normal[1], normal[2], 1])
    colors = colors.concat([normal[0], normal[1], normal[2], 1])
    colors = colors.concat([normal[0], normal[1], normal[2], 1])
    // colors = colors.concat([r1, g1, b1, 1]);
  }

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(colors),
    gl.STATIC_DRAW)
}

function setUpProgram () {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#c')
  const gl = canvas.getContext('webgl2')
  if (!gl) {
    const doc = canvas.ownerDocument
    const temp = document.createElement('div')
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
      `
    const div = temp.querySelector('div')
    doc.querySelector('#viewportContainer').appendChild(div)
    return
  }

  // setup GLSL program
  const program = webglUtils.createProgramFromSources(gl,
    [vertexShaderSource, fragmentShaderSource])

  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, 'a_position')
  const colorAttributeLocation = gl.getAttribLocation(program, 'a_color')

  // lookup uniforms
  const matrixLocation = gl.getUniformLocation(program, 'u_matrix')

  gl.canvas.addEventListener('confirmSettings', (e) => {
    initialState.windSpeed = vec2.fromValues(e.detail.windSpeedX, e.detail.windSpeedY)
    animCall = -1
    plClear()
    simOut = simulate()
    animCall = requestAnimationFrame(drawScene)
  })

  const spherePositionBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, spherePositionBuffer)
  const sphereVertices = generateSphereVertices(vec3.fromValues(0.0, 0.0, 0.0), initialState.sphere.radius, 16, 24)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphereVertices), gl.STATIC_DRAW)

  // Create a buffer for the colors.
  const sphereColorBuffer = gl.createBuffer()
  // Set the colors.
  setColors(gl, sphereColorBuffer, sphereVertices)

  const envboxPositionBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, envboxPositionBuffer)
  // kludge fix for the time being to generate the disc using the envbox buffer
  // const envboxVertices = generateTriangleFanVertices(vec3.fromValues(0, 0, 0), vec3.fromValues(0, 0, -1), 24.0, 32)
  let envboxVertices = generateBox(5, 5, 2.5, Math.PI / 4)
  // let envboxVertices = generateBox(5, 2.5, 2.5, 0)
  for (let i = 0; i < envboxVertices.length; i += 9) {
    envboxTriangles.push(new Triangle(
      vec3.fromValues(envboxVertices[i], envboxVertices[i + 1], envboxVertices[i + 2]),
      vec3.fromValues(envboxVertices[i + 3], envboxVertices[i + 4], envboxVertices[i + 5]),
      vec3.fromValues(envboxVertices[i + 6], envboxVertices[i + 7], envboxVertices[i + 8])))
  }
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(envboxVertices), gl.STATIC_DRAW)

  // Create a buffer for the colors.
  const envboxColorBuffer = gl.createBuffer()
  // Set the colors.
  setColors(gl, envboxColorBuffer, envboxVertices)

  const linePositionBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, linePositionBuffer)
  const lineVertices = generateAllLineVertices(gl)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW)

  const lineColorBuffer = gl.createBuffer()
  setColors(gl, lineColorBuffer, lineVertices, true)

  const particlePositionBuffer = gl.createBuffer()

  // particle position buffer is handled in draw loop

  // Create a buffer for the colors.
  const particleColorBuffer = gl.createBuffer()
  // color settings are handled in draw loop

  const rbdPositionBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, rbdPositionBuffer)
  const rbdVertices = cubeObj.position

  // console.log(rbdVertices, sphereVertices)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rbdVertices), gl.STATIC_DRAW)

  const rbdColorBuffer = gl.createBuffer()
  setColors(gl, rbdColorBuffer, rbdVertices, false)

  const rbdLinesPositionBuffer = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, rbdLinesPositionBuffer)
  const rbdLinesVertices = [-40, rbdCollisionPlaneHeight, 0, 40, rbdCollisionPlaneHeight, 0]
  // console.log(rbdVertices, sphereVertices)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rbdLinesVertices), gl.STATIC_DRAW)

  const rbdLinesColorBuffer = gl.createBuffer()
  setColors(gl, rbdLinesColorBuffer, rbdLinesVertices, true)

  simOut = simulate()

  animCall = requestAnimationFrame(drawScene)

  function drawScene (now) {
    const fps = simOut.fps
    const maxFrame = simOut.maxFrame

    const spherePositions = simOut.spherePositions

    const particlePositions = simOut.particlePositions
    const particleColors = simOut.particleColors

    const rbdStates = simOut.rbdStates

    now *= 0.001
    const frame = Math.floor(now * fps) % maxFrame
    // console.log(frame, particlePositions[frame]);
    webglUtils.resizeCanvasToDisplaySize(gl.canvas)

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST)

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE)

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program)

    let firstVaoIndex = 0
    let lastVaoIndex = 0

    if (configSets[configIndex].simType.data === 'bouncingball') {
      firstVaoIndex = 0
      lastVaoIndex = 1
    } else if (configSets[configIndex].simType.data === 'particles') {
      firstVaoIndex = 3
      lastVaoIndex = 3
    } else if (configSets[configIndex].simType.data === 'rbd') {
      firstVaoIndex = 4
      lastVaoIndex = 5
    }

    for (let i = firstVaoIndex; i <= lastVaoIndex; i++) {
      // Bind the attribute/buffer set we want.
      let vao = null
      let positionBuffer = null
      let colorBuffer = null
      let numVertices = null
      let primitiveType = null
      switch (i) {
        case 0:
        // CASE 0: bouncing sphere (gravity simulation and collisions)
          vao = gl.createVertexArray()
          positionBuffer = spherePositionBuffer
          colorBuffer = sphereColorBuffer
          numVertices = sphereVertices.length / 3
          primitiveType = gl.TRIANGLES
          break
        case 1:
        // CASE 1: environment box (collisions)
          vao = gl.createVertexArray()
          positionBuffer = envboxPositionBuffer
          colorBuffer = envboxColorBuffer
          numVertices = envboxVertices.length / 3
          primitiveType = gl.TRIANGLES
          break
        case 2:
        // CASE 2: line visualization (point trails or particle choreography)
          vao = gl.createVertexArray()
          positionBuffer = linePositionBuffer
          colorBuffer = lineColorBuffer
          numVertices = lineVertices.length / 3
          primitiveType = gl.LINES
          break
        case 3:
        // CASE 3: particle simulation (gravity, wind, air resistance)
          vao = gl.createVertexArray()
          positionBuffer = particlePositionBuffer
          colorBuffer = particleColorBuffer
          numVertices = particlePositions[frame].length / 3
          primitiveType = gl.POINTS

          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particlePositions[frame]), gl.STATIC_DRAW)

          gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(particleColors[frame]), gl.STATIC_DRAW)
          break
        case 4:
        // CASE 4: RBD simulation (cube and plane)
          vao = gl.createVertexArray()
          positionBuffer = rbdPositionBuffer
          colorBuffer = rbdColorBuffer
          // numVertices = rbdPositions[frame].length / 3
          numVertices = rbdVertices.length / 3
          primitiveType = gl.TRIANGLES
          break
        case 5:
        // CASE 5: RBD simulation supplemental (plane)
          vao = gl.createVertexArray()
          positionBuffer = rbdLinesPositionBuffer
          colorBuffer = rbdLinesColorBuffer
          // numVertices = rbdPositions[frame].length / 3
          numVertices = rbdLinesVertices.length / 3
          primitiveType = gl.LINES
          break
        default:
          break
      }
      gl.bindVertexArray(vao)

      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

      gl.enableVertexAttribArray(positionAttributeLocation)
      let size = 3
      let type = gl.FLOAT
      let normalize = false
      let stride = 0
      let offset = 0
      gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset)

      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)

      gl.enableVertexAttribArray(colorAttributeLocation)
      size = 4
      type = gl.FLOAT
      normalize = false
      stride = 0
      offset = 0
      gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset)

      const matrix = mat4.create()
      mat4.ortho(matrix,
        -gl.canvas.clientWidth / 50, gl.canvas.clientWidth / 50,
        -gl.canvas.clientHeight / 50, gl.canvas.clientHeight / 50,
        -gl.canvas.clientWidth / 50, gl.canvas.clientWidth / 50)
      if (i === 0) {
        // let frame = Math.floor(now * fps) % maxFrame;  // moved to top of function
        mat4.translate(matrix, matrix, vec3.fromValues(spherePositions[frame][0], spherePositions[frame][1], spherePositions[frame][2]))
      }
      if (i === 4) {
        // let frame = Math.floor(now * fps) % maxFrame;  // moved to top of function
        const rotation = mat4.create()
        mat4.fromQuat(rotation, rbdStates[frame].q)
        mat4.translate(matrix, matrix, vec3.fromValues(rbdStates[frame].x[0], rbdStates[frame].x[1], rbdStates[frame].x[2]))
        mat4.multiply(matrix, matrix, rotation)
      }

      gl.uniformMatrix4fv(matrixLocation, false, matrix)

      // var primitiveType = i == 2 ? gl.LINES : gl.TRIANGLES;
      offset = 0
      const count = numVertices
      gl.drawArrays(primitiveType, offset, count)
    }

    if (animCall !== -1) {
      animCall = requestAnimationFrame(drawScene)
    } else {
      animCall = -2
    }
  }
}
