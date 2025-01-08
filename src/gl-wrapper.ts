import * as Gl from "./gl-functions";

export class GlWrapper{
  #context: Gl.GlVersionedContext;
  #funcs: Gl.GlFunctions;

  private constructor(context: Gl.GlContext){
    this.#context = context as Gl.GlVersionedContext;
    this.#funcs = new Gl.GlFunctions(context as Gl.GlVersionedContext);
  }

  static latest(canvas: HTMLCanvasElement): GlWrapper{
    const gl2ctx = canvas.getContext("webgl2");
    if(gl2ctx){
      return new GlWrapper({ version: Gl.GlVersion.WebGL2, gl: gl2ctx });
    }

    const gl1ctx = canvas.getContext("webgl");
    if(gl1ctx){
      return new GlWrapper({ version: Gl.GlVersion.WebGL1, gl: gl1ctx });
    }

    throw new Error("Failed to create WebGL wrapper: WebGL not supported");
  }

  static ofVersion(canvas: HTMLCanvasElement, version: Gl.GlVersion): GlWrapper{
    let gl: Gl.GlRenderingContextObj | null;
    switch(version){
      case Gl.GlVersion.WebGL1: gl = canvas.getContext("webgl"); break;
      case Gl.GlVersion.WebGL2: gl = canvas.getContext("webgl2"); break;
    }

    if(!gl)throw new Error("Failed to create WebGL wrapper: Version not supported");
    return new GlWrapper({ version, gl });
  }

  get context(): Gl.GlVersionedContext{
    return this.#context;
  }

  get funcs(): Gl.GlFunctions{
    return this.#funcs;
  }
}
