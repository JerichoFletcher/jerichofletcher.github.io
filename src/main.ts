import './style.css'

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
  
  function renderLoop(t: number){
    if(!gl)return;

    const rate = 0.001;
    const trigNorm = (x: number) => (x + 1) / 2;

    gl.clearColor(
      trigNorm(Math.sin(rate * t)),
      trigNorm(Math.sin(rate * t - Math.PI * 1 / 3)),
      trigNorm(Math.sin(rate * t - Math.PI * 2 / 3)),
      1
    );
    gl.clear(gl.COLOR_BUFFER_BIT);

    requestAnimationFrame(renderLoop);
  }

  renderLoop(0);
}

main();
