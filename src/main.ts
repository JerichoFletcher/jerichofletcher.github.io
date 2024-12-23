import './style.css'

function renderLoop(gl: WebGLRenderingContext){
  gl.clearColor(0, 0.5, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function main(){
  const canvas = document.getElementById("cnv") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl");
  if(!gl){
    console.error("WebGL not supported");
    return;
  }
  
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  document.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  renderLoop(gl);
}

main();
