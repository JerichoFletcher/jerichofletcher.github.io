const extName_VAO = "OES_vertex_array_object";
const extName_instanced_arrays = "ANGLE_instanced_arrays";

export enum GlVersion{
  WebGL1,
  WebGL2,
}

interface GlExtMethods{
  readonly isExtension?: boolean;
}

interface GlVertexArrayFunctions extends GlExtMethods{
  readonly VERTEX_ARRAY_BINDING: GLenum;
  readonly createVertexArray: () => GlVAOHandle | null;
  readonly bindVertexArray: (vao: GlVAOHandle | null) => void;
  readonly deleteVertexArray: (vao: GlVAOHandle | null) => void;
  readonly isVertexArray: (vao: GlVAOHandle | null) => GLboolean;
}

interface GlInstancedArraysFunctions extends GlExtMethods{
  readonly VERTEX_ATTRIB_ARRAY_DIVISOR: GLenum;
  readonly vertexAttribDivisor: (index: GLuint, divisor: GLuint) => void;
  readonly drawArraysInstanced: (mode: GLenum, first: GLint, count: GLsizei, primcount: GLsizei) => void;
  readonly drawElementsInstanced: (mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, primcount: GLsizei) => void;
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

export class GlFunctions{
  #ctx: GlVersionedContext;
  #ext: Map<string, GlExtMethods>;

  constructor(ctx: GlVersionedContext){
    this.#ctx = ctx;
    this.#ext = new Map();

    if(ctx.version === GlVersion.WebGL1){
      this.setExtension(extName_VAO, this.retrieveExtension(ctx.gl, extName_VAO));
      this.setExtension(extName_instanced_arrays, this.retrieveExtension(ctx.gl, extName_instanced_arrays));
    }else{
      this.setExtension<GlVertexArrayFunctions>(extName_VAO, ctx.gl);
      this.setExtension<GlInstancedArraysFunctions>(extName_instanced_arrays, ctx.gl);
    }
  }

  private retrieveExtension<T extends GlExtMethods>(gl: GlRenderingContextObj, name: string): T | null{
    const ext = gl.getExtension(name);
    if(!ext)return null;
    
    const prefix = name.split("_", 1)[0];
    const proto = Object.getPrototypeOf(ext) as Record<string, unknown>;
    
    return {
      ...Object.fromEntries(
        Object.entries(proto).map(([key, val]) => [
          key.replace(new RegExp(`_?${prefix}$`, "i"), ""),
          typeof val === "function" ? this.callWithContext(ext, val as (...args: unknown[]) => unknown) : val,
        ])
      ),
      isExtension: true,
    } as T;
  }

  private callWithContext<T extends unknown[], U>(thisArg: unknown, method: (...args: T) => U){
    return (...args: T) => method.call(thisArg, ...args);
  }

  private getExtension<T extends GlExtMethods>(name: string){
    if(!this.#ext.has(name))throw new Error(`Missing WebGL extension: ${name}`);
    return this.#ext.get(name) as T;
  }

  private setExtension<T extends GlExtMethods>(name: string, value: T | null){
    if(!value){
      this.#ext.delete(name);
    }else{
      this.#ext.set(name, value);
    }
  }

  get context(): GlVersionedContext{
    return this.#ctx;
  }

  get loadedExtensions(): ReadonlyMap<string, GlExtMethods>{
    return new Map([...this.#ext.entries()].filter(([, val]) => val.isExtension));
  }

  get vertexArray(): GlVertexArrayFunctions{
    return this.getExtension<GlVertexArrayFunctions>(extName_VAO);
  }

  get instancedArrays(): GlInstancedArraysFunctions{
    return this.getExtension<GlInstancedArraysFunctions>(extName_instanced_arrays);
  }
}
