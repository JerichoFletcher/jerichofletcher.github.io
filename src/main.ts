import vertSrc from "./shaders/test.vert.glsl";
import fragSrc from "./shaders/test.frag.glsl";

import { GlWrapper } from "./gl-wrapper";
import { GlProgram, GlShader } from "./gl-shader-program";
import { GlBuffer } from "./gl-buffer";
import { GlVAO } from "./gl-vao";
import { mat4 } from "gl-matrix";
import { GlVersion } from "./gl-functions";
import { usingBindables } from "./intfs/bindable";
import { GlBufferLayout } from "./gl-layout";
import * as E from "./gl-enum";
import { GlTexture } from "./gl-texture";

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

  const vertShader = GlShader.create(glWrapper, E.ShaderType.Vertex, vertSrc);
  const fragShader = GlShader.create(glWrapper, E.ShaderType.Fragment, fragSrc);
  const program = GlProgram.create(glWrapper, vertShader, fragShader);

  const vData = new Float32Array([
    -0.500, +0.500, +0.000, 1.0, 1.0, 1.0, 0.0, 0.0,
    +0.500, +0.500, +0.000, 1.0, 1.0, 1.0, 1.0, 0.0,
    +0.500, -0.500, +0.000, 1.0, 1.0, 1.0, 1.0, 1.0,
    -0.500, -0.500, +0.000, 1.0, 1.0, 1.0, 0.0, 1.0,
  ]);
  const eData = new Int16Array([0, 1, 2, 0, 2, 3]);
  
  const vbo = GlBuffer.create(glWrapper, E.BufferType.Array, E.BufferDataUsage.Static, vData);
  const ebo = GlBuffer.create(glWrapper, E.BufferType.Element, E.BufferDataUsage.Static, eData);
  
  const layout = new GlBufferLayout(glWrapper);
  layout.setAttribute({
    attribName: "a_position",
    targetBuffer: vbo,
    stride: 8 * vData.BYTES_PER_ELEMENT,
    offset: 0 * vData.BYTES_PER_ELEMENT,
  }, {
    attribName: "a_color",
    targetBuffer: vbo,
    stride: 8 * vData.BYTES_PER_ELEMENT,
    offset: 3 * vData.BYTES_PER_ELEMENT,
  }, {
    attribName: "a_uv",
    targetBuffer: vbo,
    stride: 8 * vData.BYTES_PER_ELEMENT,
    offset: 6 * vData.BYTES_PER_ELEMENT,
  });
  
  const vao = GlVAO.create(glWrapper);
  layout.configure(vao, program);
  vao.bindElementBuffer(ebo);
  
  let aspect = gl.canvas.width / gl.canvas.height;
  const uWorld = mat4.create();
  const uView = mat4.lookAt(mat4.create(), [0, 0, 1], [0, 0, 0], [0, 1, 0]);
  const uProj = mat4.ortho(mat4.create(), -aspect, aspect, -1, 1, 0, 1000);

  const uTexture = GlTexture.create(glWrapper, 0);
  uTexture.setFilter(E.TextureMinFilter.Nearest, E.TextureMagFilter.Nearest);
  uTexture.setTextureWrap(E.TextureWrap.ClampToEdge, E.TextureWrap.ClampToEdge);
  uTexture.setData(new Uint8Array([
    63, 63, 0, 127, 63, 0, 191, 63, 0, 255, 63, 0,
    63, 127, 0, 127, 127, 0, 191, 127, 0, 255, 127, 0,
    63, 191, 0, 127, 191, 0, 191, 191, 0, 255, 191, 0,
    63, 255, 0, 127, 255, 0, 191, 255, 0, 255, 255, 0,
  ]), gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, 4, 4);

  usingBindables([program], () => {
    program.setUniform("u_world", uWorld);
    program.setUniform("u_view", uView);
    program.setUniform("u_proj", uProj);
    program.setUniform("u_texture", uTexture);
  });

  let lastTime = 0;
  function renderLoop(t: number){
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    usingBindables([program], () => {
      const deltaTime = lastTime - t;
      program.setUniform("u_world", mat4.rotateZ(uWorld, uWorld, deltaTime * Math.PI / 5000));
      
      const newAspect = gl.canvas.width / gl.canvas.height;
      if(aspect !== newAspect){
        aspect = newAspect;
        program.setUniform("u_proj", mat4.ortho(uProj, -aspect, aspect, -1, 1, 0, 1000));
      }
      
      vao.drawElements(program, E.DrawMode.TriangleFan, eData.length, E.DType.UShort, 0);
    });

    lastTime = t;
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);
}

function main(){
  const canvas = document.getElementById("cnv") as HTMLCanvasElement;  
  const glWrapper = initialize(canvas);
  beginDraw(glWrapper);
}

main();
