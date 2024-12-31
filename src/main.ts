import { GlWrapper } from "./gl-wrapper";
import { GlProgram, GlShader, ShaderType } from "./gl-shader-program";
import { BufferDataUsage, BufferType, GlBuffer } from "./gl-buffer";
import { GlVAO } from "./gl-vao";

async function loadText(url: string): Promise<string>{
  const resp = await fetch(url);
  return await resp.text();
}

function initialize(canvas: HTMLCanvasElement): GlWrapper{
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  document.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  const glWrapper = GlWrapper.latest(canvas);
  const gl = glWrapper.context.gl;
  console.log("Loaded WebGL version:", gl.getParameter(gl.VERSION));
  return glWrapper;
}

async function beginDraw(glWrapper: GlWrapper){
  const gl = glWrapper.context.gl;

  const vertSrc = await loadText("/shaders/test.vert.glsl");
  const fragSrc = await loadText("/shaders/test.frag.glsl");

  const vertShader = GlShader.create(glWrapper, ShaderType.Vertex, vertSrc);
  const fragShader = GlShader.create(glWrapper, ShaderType.Fragment, fragSrc);
  const program = GlProgram.create(glWrapper, vertShader, fragShader);

  const vData = new Float32Array([
    -0.5, -0.5, 0.5, 0.5, 0.0,
    +0.5, -0.5, 0.0, 1.0, 0.0,
    +0.5, +0.5, 0.0, 0.5, 0.5,
    -0.5, +0.5, 0.5, 0.0, 0.5,
  ]);
  const eData = new Int16Array([0, 1, 2, 0, 2, 3]);

  const vbo = GlBuffer.create(glWrapper, BufferType.Array, BufferDataUsage.Static);
  const ebo = GlBuffer.create(glWrapper, BufferType.Element, BufferDataUsage.Static);
  vbo.setData(vData);
  ebo.setData(eData);

  const vao = GlVAO.create(glWrapper);
  vao.setAttribute(0, vbo, 2, gl.FLOAT, 5 * Float32Array.BYTES_PER_ELEMENT, 0);
  vao.setAttribute(1, vbo, 3, gl.FLOAT, 5 * Float32Array.BYTES_PER_ELEMENT, 2 * Float32Array.BYTES_PER_ELEMENT);
  vao.bindElementBuffer(ebo);

  function renderLoop(t: number){
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    program.use();
    program.setUniform("u_time", t / 3000);

    vao.bind();
    gl.drawElements(gl.TRIANGLES, eData.length, gl.UNSIGNED_SHORT, 0);
    vao.unbind();

    requestAnimationFrame(renderLoop);
  }

  renderLoop(0);
}

async function main(){
  const canvas = document.getElementById("cnv") as HTMLCanvasElement;  
  const glWrapper = initialize(canvas);
  await beginDraw(glWrapper);
}

main();
