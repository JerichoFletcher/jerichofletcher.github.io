import { GlWrapper } from "./gl-wrapper";
import { Bindable } from "./intfs/bindable";
import { DependsOnDisposedState, Disposable } from "./intfs/disposable";
import * as E from "./gl-enum";

export class GlTexture implements Disposable, Bindable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #texHandle: DependsOnDisposedState<WebGLTexture>;
  #texUnit: GLuint;

  private constructor(glWrapper: GlWrapper, texUnit: GLuint){
    this.#glWrapper = glWrapper;
    const gl = this.#glWrapper.context.gl;

    if(texUnit < 0 || (gl.TEXTURE31 - gl.TEXTURE0) < texUnit)
      throw new Error(`Texture unit ${texUnit} is out of range`);

    const texHandle = glWrapper.context.gl.createTexture();
    if(!texHandle){
      const err = glWrapper.context.gl.getError();
      throw new Error(`Failed to create texture object (error code: ${err})`);
    }

    this.#texHandle = DependsOnDisposedState.validBeforeDisposed(this, texHandle);
    this.#texUnit = texUnit;
    this.#disposed = false;
  }

  static create(glWrapper: GlWrapper, texUnit: GLuint){
    return new GlTexture(glWrapper, texUnit);
  }

  setData(image: HTMLImageElement, format: GLenum, internalFormat: GLenum, type: GLenum): void;
  setData(rawData: Uint8Array, format: GLenum, internalFormat: GLenum, type: GLenum, width: number, height: number): void;
  setData(data: HTMLImageElement | Uint8Array, format: GLenum, internalFormat: GLenum, type: GLenum, width?: number, height?: number): void{
    this.bind();
    const gl = this.#glWrapper.context.gl;

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    if(data instanceof HTMLImageElement){
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, data);
    }else{
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width!, height!, 0, format, type, data);
    }
  }

  setMinFilter(filter: E.TextureMinFilter): void{
    this.bind();
    const gl = this.#glWrapper.context.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  }

  setMagFilter(filter: E.TextureMagFilter): void{
    this.bind();
    const gl = this.#glWrapper.context.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  }

  setFilter(minFilter: E.TextureMinFilter, magFilter: E.TextureMagFilter): void{
    this.setMinFilter(minFilter);
    this.setMagFilter(magFilter);
  }

  setTextureWrapS(wrap: E.TextureWrap): void{
    this.bind();
    const gl = this.#glWrapper.context.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  }

  setTextureWrapT(wrap: E.TextureWrap): void{
    this.bind();
    const gl = this.#glWrapper.context.gl;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  }

  setTextureWrap(wrapS: E.TextureWrap, wrapT: E.TextureWrap): void{
    this.setTextureWrapS(wrapS);
    this.setTextureWrapT(wrapT);
  }

  bind(): void{
    const gl = this.#glWrapper.context.gl;
    gl.activeTexture(gl.TEXTURE0 + this.#texUnit);
    gl.bindTexture(gl.TEXTURE_2D, this.#texHandle.value);
  }

  unbind(): void{
    const gl = this.#glWrapper.context.gl;
    gl.activeTexture(gl.TEXTURE0 + this.#texUnit);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  generateMipmap(): void{
    this.bind();
    this.#glWrapper.context.gl.generateMipmap(this.#glWrapper.context.gl.TEXTURE_2D);
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get texture(): WebGLTexture{
    return this.#texHandle.value;
  }

  get textureUnit(): GLuint{
    return this.#texUnit;
  }

  get isDisposed(): boolean{
    return this.#disposed;
  }

  dispose(): void{
    if(!this.#disposed){
      this.#glWrapper.context.gl.deleteTexture(this.#texHandle.value);
      this.#disposed = true;
    }
  }
}