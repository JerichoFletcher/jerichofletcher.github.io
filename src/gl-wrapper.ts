import { GlVersionedContext, GlExtension, GlVersion, GlRenderingContextObj, GlContext } from "./gl-extension";

export class GlWrapper{
  #context: GlVersionedContext;
  #extension: GlExtension;

  private constructor(context: GlContext){
    this.#context = context as GlVersionedContext;
    this.#extension = new GlExtension(context as GlVersionedContext);
  }

  static latest(canvas: HTMLCanvasElement): GlWrapper{
    const gl2ctx = canvas.getContext("webgl2");
    if(gl2ctx){
      return new GlWrapper({ version: GlVersion.WebGL2, gl: gl2ctx });
    }

    const gl1ctx = canvas.getContext("webgl");
    if(gl1ctx){
      return new GlWrapper({ version: GlVersion.WebGL1, gl: gl1ctx });
    }

    throw new Error("Failed to create WebGL wrapper: WebGL not supported");
  }

  static ofVersion(canvas: HTMLCanvasElement, version: GlVersion): GlWrapper{
    let gl: GlRenderingContextObj | null;
    switch(version){
      case GlVersion.WebGL1: gl = canvas.getContext("webgl"); break;
      case GlVersion.WebGL2: gl = canvas.getContext("webgl2"); break;
    }

    if(!gl)throw new Error("Failed to create WebGL wrapper: Version not supported");
    return new GlWrapper({ version, gl });
  }

  get context(): GlVersionedContext{
    return this.#context;
  }

  get ext(): GlExtension{
    return this.#extension;
  }
}
