import vertSrc from "./shaders/test.vert.glsl";
import fragSrc from "./shaders/test.frag.glsl";

import { GlWrapper } from "./gl-wrapper";
import { GlProgram, GlShader, ShaderType } from "./gl-shader-program";
import { BufferDataUsage, BufferType, GlBuffer } from "./gl-buffer";
import { GlVAO } from "./gl-vao";
import { mat4 } from "gl-matrix";
import { GlVersion } from "./gl-functions";
import { usingBindables } from "./intfs/bindable";
import { GlBufferLayout } from "./gl-layout";

function initialize(canvas: HTMLCanvasElement): GlWrapper{
  // const glWrapper = GlWrapper.latest(canvas);
  const glWrapper = GlWrapper.ofVersion(canvas, GlVersion.WebGL1);
  const gl = glWrapper.context.gl;

  const onResizeCanvas = () => {
    let update = false;

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if(canvas.width !== displayWidth || canvas.height !== displayHeight){
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      update = true;
    }

    if(update){
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
  }
  
  window.addEventListener("resize", onResizeCanvas);
  onResizeCanvas();

  console.log("Loaded WebGL version:", gl.getParameter(gl.VERSION));
  console.log("Loaded extensions:", [...glWrapper.funcs.loadedExtensions.keys()]);
  return glWrapper;
}

function beginDraw(glWrapper: GlWrapper){
  const gl = glWrapper.context.gl;

  const vertShader = GlShader.create(glWrapper, ShaderType.Vertex, vertSrc);
  const fragShader = GlShader.create(glWrapper, ShaderType.Fragment, fragSrc);
  const program = GlProgram.create(glWrapper, vertShader, fragShader);

  const vData = new Float32Array([
    +0.000, +0.000, +0.000, 0.7, 0.7, 0.7,
    +0.000, +1.000, +0.000, 1.0, 0.0, 0.0,
    -0.866, +0.500, +0.000, 0.7, 0.0, 0.7,
    -0.866, -0.500, +0.000, 0.0, 0.0, 1.0,
    +0.000, -1.000, +0.000, 0.0, 0.7, 0.7,
    +0.866, -0.500, +0.000, 0.0, 1.0, 0.0,
    +0.866, +0.500, +0.000, 0.7, 0.7, 0.0,
  ]);
  const eData = new Int16Array([0, 1, 2, 3, 4, 5, 6, 1]);
  
  const vbo = GlBuffer.create(glWrapper, BufferType.Array, BufferDataUsage.Static);
  const ebo = GlBuffer.create(glWrapper, BufferType.Element, BufferDataUsage.Static);
  vbo.setData(vData);
  ebo.setData(eData);
  
  const vao = GlVAO.create(glWrapper);
  const layout = new GlBufferLayout(glWrapper);
  layout.setAttribute({
    attribName: "a_position",
    targetBuffer: vbo,
    stride: 6 * vData.BYTES_PER_ELEMENT,
    offset: 0 * vData.BYTES_PER_ELEMENT,
  }, {
    attribName: "a_color",
    targetBuffer: vbo,
    stride: 6 * vData.BYTES_PER_ELEMENT,
    offset: 3 * vData.BYTES_PER_ELEMENT,
  });

  layout.configure(vao, program);
  vao.bindElementBuffer(ebo);
  
  let aspect = gl.canvas.width / gl.canvas.height;
  const uWorld = mat4.create();
  const uView = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);
  const uProj = mat4.ortho(mat4.create(), -aspect, aspect, -1, 1, 0, 1000);

  usingBindables([program], () => {
    program.setUniformMatrix("u_world", uWorld);
    program.setUniformMatrix("u_view", uView);
    program.setUniformMatrix("u_proj", uProj);
  });
  
  // gl.enable(gl.CULL_FACE);
  // gl.cullFace(gl.BACK);

  let lastTime = 0;
  function renderLoop(t: number){
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    usingBindables([program], () => {
      program.setUniform("u_time", t / 1000);

      const deltaTime = lastTime - t;
      program.setUniformMatrix("u_world", mat4.rotateZ(uWorld, uWorld, deltaTime * Math.PI / 2000));
      
      const newAspect = gl.canvas.width / gl.canvas.height;
      if(aspect !== newAspect){
        aspect = newAspect;
        program.setUniformMatrix("u_proj", mat4.ortho(uProj, -aspect, aspect, -1, 1, -1, 1));
      }
      
      vao.drawElements(gl.TRIANGLE_FAN, eData.length, gl.UNSIGNED_SHORT, 0);
    });

    lastTime = t;
    requestAnimationFrame(renderLoop);
  }

  renderLoop(0);
}

function main(){
  const canvas = document.getElementById("cnv") as HTMLCanvasElement;  
  const glWrapper = initialize(canvas);
  beginDraw(glWrapper);
}

main();
