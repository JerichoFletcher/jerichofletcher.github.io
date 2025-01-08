import { DependsOnDisposedState, Disposable } from "./intfs/disposable";
import { GlUniformInfo, GlAttributeInfo, getUniformInfo, getAttribInfo } from "./gl-info";
import { GlWrapper } from "./gl-wrapper";
import { Bindable, usingBindables } from "./intfs/bindable";
import * as E from "./gl-enum";
import { GlTexture } from "./gl-texture";
import { isBoolArray, isNumberArray } from "./type-guards";

export type GlVertShader = GlShader & { type: E.ShaderType.Vertex };
export type GlFragShader = GlShader & { type: E.ShaderType.Fragment };

export class GlShader implements Disposable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #type: E.ShaderType;
  #shaderHandle: DependsOnDisposedState<WebGLShader>;

  private constructor(glWrapper: GlWrapper, type: E.ShaderType, src: string){
    this.#glWrapper = glWrapper;
    this.#type = type;
    
    const gl = glWrapper.context.gl;

    const shader = gl.createShader(type);
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

  static create(glWrapper: GlWrapper, type: E.ShaderType.Vertex, src: string): GlVertShader;
  static create(glWrapper: GlWrapper, type: E.ShaderType.Fragment, src: string): GlFragShader;
  static create(glWrapper: GlWrapper, type: E.ShaderType, src: string){
    return new GlShader(glWrapper, type, src)
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get type(): E.ShaderType{
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

export class GlProgram implements Disposable, Bindable{
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
      this.#unifs.set(info.name, getUniformInfo(info, location));
    }

    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES) as number;
    for(let i = 0; i < numAttribs; i++){
      const info = gl.getActiveAttrib(program, i)!;
      const location = gl.getAttribLocation(program, info.name)!;
      this.#attbs.set(info.name, getAttribInfo(info, location));
    }

    this.#progHandle = DependsOnDisposedState.validBeforeDisposed(this, program);
    this.#vert = vert;
    this.#frag = frag;
    this.#disposed = false;
  }

  static create(glWrapper: GlWrapper, vert: GlVertShader, frag: GlFragShader): GlProgram{
    return new GlProgram(glWrapper, vert, frag);
  }

  bind(): void{
    this.#glWrapper.context.gl.useProgram(this.#progHandle.value);
  }

  unbind(): void{
    this.#glWrapper.context.gl.useProgram(null);
  }

  setUniform(name: string, val: boolean | boolean[] | number | number[] | AllowSharedBufferSource | GlTexture): void{
    usingBindables([this], () => {
      const gl = this.#glWrapper.context.gl;
      const info = this.#unifs.get(name);
      if(!info)throw new Error(`Unknown uniform: ${name}`);

      switch(info.type){
        case E.DType.Bool:
          if(typeof val !== "boolean")throw new Error(`Wrong data type for uniform ${name}; expected boolean, found ${typeof val}`);
          gl.uniform1i(info.location, val ? 1 : 0);
          break;
        case E.DType.Byte:
        case E.DType.UByte:
        case E.DType.Short:
        case E.DType.UShort:
        case E.DType.Int:
        case E.DType.UInt:
          if(typeof val !== "number")throw new Error(`Wrong data type for uniform ${name}; expected number, found ${typeof val}`);
          gl.uniform1i(info.location, val);
          break;
        case E.DType.Float:
          if(typeof val !== "number")throw new Error(`Wrong data type for uniform ${name}; expected number, found ${typeof val}`);
          gl.uniform1f(info.location, val);
          break;
        case E.DTypeVec.Float2:
        case E.DTypeVec.Float3:
        case E.DTypeVec.Float4:
          if(!isNumberArray(val) && !(val instanceof Float32Array))
            throw new Error(`Wrong data type for uniform ${name}; expected number[] | Float32Array, found ${typeof val}`);

          {
            let expectedLength: number;
            switch(info.type){
              case E.DTypeVec.Float2: expectedLength = 2; break;
              case E.DTypeVec.Float3: expectedLength = 3; break;
              case E.DTypeVec.Float4: expectedLength = 4; break;
            }
            if(val.length !== expectedLength)throw new Error(`Wrong data size for uniform ${name}; expected ${expectedLength}, found ${val.length}`);

            switch(info.type){
              case E.DTypeVec.Float2: gl.uniform2fv(info.location, val); break;
              case E.DTypeVec.Float3: gl.uniform3fv(info.location, val); break;
              case E.DTypeVec.Float4: gl.uniform4fv(info.location, val); break;
            }
          }

          break;
        case E.DTypeVec.Int2:
        case E.DTypeVec.Int3:
        case E.DTypeVec.Int4:
          if(!isNumberArray(val) || !(val instanceof Int32Array || val instanceof Uint32Array))
            throw new Error(`Wrong data type for uniform ${name}; expected number[] | Float32Array, found ${typeof val}`);

          {
            let expectedLength: number;
            switch(info.type){
              case E.DTypeVec.Int2: expectedLength = 2; break;
              case E.DTypeVec.Int3: expectedLength = 3; break;
              case E.DTypeVec.Int4: expectedLength = 4; break;
            }
            if(val.length !== expectedLength)throw new Error(`Wrong data size for uniform ${name}; expected ${expectedLength}, found ${val.length}`);
            
            switch(info.type){
              case E.DTypeVec.Int2: gl.uniform2iv(info.location, val); break;
              case E.DTypeVec.Int3: gl.uniform3iv(info.location, val); break;
              case E.DTypeVec.Int4: gl.uniform4iv(info.location, val); break;
            }
          }

          break;
        case E.DTypeVec.Bool2:
        case E.DTypeVec.Bool3:
        case E.DTypeVec.Bool4:
          if(!isBoolArray(val) || !(val instanceof Uint8Array))
            throw new Error(`Wrong data type for uniform ${name}; expected boolean[] | Uint8Array, found ${typeof val}`);

          {
            let expectedLength: number;
            switch(info.type){
              case E.DTypeVec.Bool2: expectedLength = 2; break;
              case E.DTypeVec.Bool3: expectedLength = 3; break;
              case E.DTypeVec.Bool4: expectedLength = 4; break;
            }
            if(val.length !== expectedLength)throw new Error(`Wrong data size for uniform ${name}; expected ${expectedLength}, found ${val.length}`);
            
            switch(info.type){
              case E.DTypeVec.Bool2: gl.uniform2iv(info.location, val); break;
              case E.DTypeVec.Bool3: gl.uniform3iv(info.location, val); break;
              case E.DTypeVec.Bool4: gl.uniform4iv(info.location, val); break;
            }
          }

          break;
        case E.DTypeMat.FloatM2:
        case E.DTypeMat.FloatM3:
        case E.DTypeMat.FloatM4:
          if(!isNumberArray(val) && !(val instanceof Float32Array))
            throw new Error(`Wrong data type for uniform ${name}; expected number[] | Float32Array, found ${typeof val}`);

          {
            let expectedLength: number;
            switch(info.type){
              case E.DTypeMat.FloatM2: expectedLength = 4; break;
              case E.DTypeMat.FloatM3: expectedLength = 9; break;
              case E.DTypeMat.FloatM4: expectedLength = 16; break;
            }
            if(val.length !== expectedLength)throw new Error(`Wrong data size for uniform ${name}; expected ${expectedLength}, found ${val.length}`);

            switch(info.type){
              case E.DTypeMat.FloatM2: gl.uniformMatrix2fv(info.location, false, val); break;
              case E.DTypeMat.FloatM3: gl.uniformMatrix3fv(info.location, false, val); break;
              case E.DTypeMat.FloatM4: gl.uniformMatrix4fv(info.location, false, val); break;
            }
          }

          break;
        case E.DTypeSampler.Sampler2D:
          if(!(val instanceof GlTexture))throw new Error(`Wrong data type for uniform ${name}; expected GlTexture, found ${typeof val}`);
          val.bind();
          gl.uniform1i(info.location, val.textureUnit);
          break;
        case E.DTypeSampler.SamplerCube:
          throw new Error("Sampler cube uniform not implemented");
      }
    });
  }

  setUniformTexture(name: string, texture: GlTexture): void{
    const gl = this.#glWrapper.context.gl;
    const info = this.#unifs.get(name);
    if(!info)throw new Error(`Unknown uniform: ${name}`);

    texture.bind();
    gl.uniform1i(info.location, texture.textureUnit);
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
    return this.#unifs;
  }

  get attributes(): ReadonlyMap<string, GlAttributeInfo>{
    return this.#attbs;
  }

  get isDisposed(): boolean{
    return this.#disposed;
  }

  dispose(): void{
    if(!this.#disposed){
      this.#glWrapper.context.gl.detachShader(this.#progHandle.value, this.#vert.shader);
      this.#glWrapper.context.gl.detachShader(this.#progHandle.value, this.#frag.shader);
      this.#glWrapper.context.gl.deleteProgram(this.#progHandle.value);
      this.#disposed = true;
    }
  }
}
