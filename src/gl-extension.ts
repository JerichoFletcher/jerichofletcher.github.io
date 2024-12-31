const extName_VAO = "OES_vertex_array_object";

export enum GlVersion{
  WebGL1,
  WebGL2,
}

interface GlExtMethods{}

interface GlVAOFunctions extends GlExtMethods{
  readonly create: () => GlVAOHandle | null;
  readonly bind: (vao: GlVAOHandle | null) => void;
  readonly delete: (vao: GlVAOHandle | null) => void;
  readonly isVAO: (vao: GlVAOHandle | null) => GLboolean;
}

export type GlVAOHandle = WebGLVertexArrayObject | WebGLVertexArrayObjectOES;

export type GlRenderingContextObj = WebGLRenderingContext | WebGL2RenderingContext;
export type GlContext = {
  readonly version: GlVersion;
  readonly gl: GlRenderingContextObj;
}
export type GlVersionedContext = {
  readonly version: GlVersion.WebGL1,
  readonly gl: WebGLRenderingContext,
} | {
  readonly version: GlVersion.WebGL2,
  readonly gl: WebGL2RenderingContext,
}

export class GlExtension{
  #ctx: GlVersionedContext;
  #ext: Map<string, GlExtMethods>;

  constructor(ctx: GlVersionedContext){
    this.#ctx = ctx;
    this.#ext = new Map();

    if(ctx.version === GlVersion.WebGL1){
      const vaoExt = ctx.gl.getExtension(extName_VAO);
      if(vaoExt){
        this.setExtension<GlVAOFunctions>(extName_VAO, {
          create: this.callWithContext(vaoExt, vaoExt.createVertexArrayOES),
          bind: this.callWithContext(vaoExt, vaoExt.bindVertexArrayOES),
          delete: this.callWithContext(vaoExt, vaoExt.deleteVertexArrayOES),
          isVAO: this.callWithContext(vaoExt, vaoExt.isVertexArrayOES),
        });
      }
    }else{
      this.setExtension<GlVAOFunctions>(extName_VAO, {
        create: this.callWithContext(ctx.gl, ctx.gl.createVertexArray),
        bind: this.callWithContext(ctx.gl, ctx.gl.bindVertexArray),
        delete: this.callWithContext(ctx.gl, ctx.gl.deleteVertexArray),
        isVAO: this.callWithContext(ctx.gl, ctx.gl.isVertexArray),
      });
    }
  }

  private callWithContext<T extends any[], U>(thisArg: any, method: (...args: T) => U){
    return (...args: T) => method.call(thisArg, ...args);
  }

  private getExtension<T extends GlExtMethods>(name: string){
    if(!this.#ext.has(name)){
      throw new Error(`Missing WebGL extension: ${name}`);
    }
    return this.#ext.get(name) as T;
  }

  private setExtension<T extends GlExtMethods>(name: string, value: T){
    this.#ext.set(name, value);
  }

  get context(): GlVersionedContext{
    return this.#ctx;
  }

  get vertexArrayObject(): GlVAOFunctions{
    return this.getExtension<GlVAOFunctions>(extName_VAO);
  }
}
