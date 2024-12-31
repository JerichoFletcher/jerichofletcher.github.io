import { DependsOnDisposedState, Disposable } from "./disposable";
import { GlWrapper } from "./gl-wrapper";

export enum ShaderType{
  Vertex,
  Fragment,
}

export type GlUniformInfo = Readonly<WebGLActiveInfo> & { readonly location: WebGLUniformLocation };
export type GlAttributeInfo = Readonly<WebGLActiveInfo> & { readonly location: GLint };

export type GlVertShader = GlShader & { type: ShaderType.Vertex };
export type GlFragShader = GlShader & { type: ShaderType.Fragment };

export class GlShader implements Disposable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #type: ShaderType;
  #shaderHandle: DependsOnDisposedState<WebGLShader>;

  private constructor(glWrapper: GlWrapper, type: ShaderType, src: string){
    this.#glWrapper = glWrapper;
    this.#type = type;
    
    const gl = glWrapper.context.gl;

    const shader = gl.createShader(type === ShaderType.Vertex ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
    if(!shader){
      const err = gl.getError();
      throw new Error(`Failed to create shader (error code ${err})`);
    }

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      const err = gl.getError();
      const log = gl.getShaderInfoLog(shader);
      
      gl.deleteShader(shader);
      throw new Error(`Failed to compile shader (error code: ${err}): ${log}`);
    }

    this.#shaderHandle = DependsOnDisposedState.validBeforeDisposed(this, shader);
    this.#disposed = false;
  }

  static create(glWrapper: GlWrapper, type: ShaderType.Vertex, src: string): GlVertShader;
  static create(glWrapper: GlWrapper, type: ShaderType.Fragment, src: string): GlFragShader;
  static create(glWrapper: GlWrapper, type: ShaderType, src: string){
    return new GlShader(glWrapper, type, src)
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get type(): ShaderType{
    return this.#type;
  }

  get shader(): WebGLShader{
    return this.#shaderHandle.value;
  }

  get isDisposed(): boolean{
    return this.#disposed;
  }

  dispose(): void{
    if(!this.#disposed){
      this.#glWrapper.context.gl.deleteShader(this.#shaderHandle.value);
      this.#disposed = true;
    }
  }
}

export class GlProgram implements Disposable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #progHandle: DependsOnDisposedState<WebGLProgram>;
  #vert: GlVertShader;
  #frag: GlFragShader;
  #unifs: Map<string, GlUniformInfo>;
  #attbs: Map<string, GlAttributeInfo>;

  private constructor(glWrapper: GlWrapper, vert: GlVertShader, frag: GlFragShader){
    this.#glWrapper = glWrapper;
    
    const gl = glWrapper.context.gl;

    const program = gl.createProgram();
    if(!program){
      const err = gl.getError();
      throw new Error(`Failed to create program (error code ${err})`);
    }

    gl.attachShader(program, vert.shader);
    gl.attachShader(program, frag.shader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
      const err = gl.getError();
      const log = gl.getProgramInfoLog(program);
      
      gl.deleteProgram(program);
      throw new Error(`Failed to link program (error code: ${err}): ${log}`);
    }

    this.#unifs = new Map();
    this.#attbs = new Map();

    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for(let i = 0; i < numUniforms; i++){
      const info = gl.getActiveUniform(program, i)!;
      const location = gl.getUniformLocation(program, info.name)!;
      this.#unifs.set(info.name, {
        name: info.name,
        size: info.size,
        type: info.type,
        location,
      });
    }

    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
    for(let i = 0; i < numAttribs; i++){
      const info = gl.getActiveAttrib(program, i)!;
      const location = gl.getAttribLocation(program, info.name)!;
      this.#attbs.set(info.name, {
        name: info.name,
        size: info.size,
        type: info.type,
        location,
      });
    }

    this.#progHandle = DependsOnDisposedState.validBeforeDisposed(this, program);
    this.#vert = vert;
    this.#frag = frag;
    this.#disposed = false;
  }

  static create(glWrapper: GlWrapper, vert: GlVertShader, frag: GlFragShader): GlProgram{
    return new GlProgram(glWrapper, vert, frag);
  }

  use(): void{
    this.#glWrapper.context.gl.useProgram(this.#progHandle.value);
  }

  setUniform(name: string, val: number): void;
  setUniform(name: string, val: number[]): void;
  setUniform(name: string, val: Float32Array): void;
  setUniform(name: string, val: number | number[] | Float32Array): void{
    const gl = this.#glWrapper.context.gl;
    const info = this.#unifs.get(name);
    if(!info)throw new Error(`Unknown uniform: ${name}`);

    if(typeof val === "number"){
      gl.uniform1f(info.location, val);
    }else if(Array.isArray(val)){
      switch(val.length){
        case 2: gl.uniform2fv(info.location, val); break;
        case 3: gl.uniform3fv(info.location, val); break;
        case 4: gl.uniform4fv(info.location, val); break;
        default: throw new Error(`Unsupported uniform array size: ${val.length}`);
      }
    }else if(val instanceof Float32Array){
      switch(val.length){
        case 4: gl.uniformMatrix2fv(info.location, false, val); break;
        case 9: gl.uniformMatrix3fv(info.location, false, val); break;
        case 16: gl.uniformMatrix4fv(info.location, false, val); break;
        default: throw new Error(`Unsupported uniform matrix size: ${val.length}`);
      }
    }
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get program(): WebGLProgram{
    return this.#progHandle.value;
  }

  get vertexShader(): GlVertShader{
    return this.#vert;
  }

  get fragmentShader(): GlFragShader{
    return this.#frag;
  }

  get uniforms(): ReadonlyMap<string, GlUniformInfo>{
    return this.#unifs as ReadonlyMap<string, GlUniformInfo>;
  }

  get attributes(): ReadonlyMap<string, GlAttributeInfo>{
    return this.#attbs as ReadonlyMap<string, GlAttributeInfo>;
  }

  get isDisposed(): boolean{
    return this.#disposed;
  }

  dispose(): void{
    if(!this.#disposed){
      this.#glWrapper.context.gl.detachShader(this.#progHandle, this.#vert.shader);
      this.#glWrapper.context.gl.detachShader(this.#progHandle, this.#frag.shader);
      this.#glWrapper.context.gl.deleteProgram(this.#progHandle);
      this.#disposed = true;
    }
  }
}
