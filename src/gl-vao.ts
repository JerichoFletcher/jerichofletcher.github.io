import { DependsOnDisposedState, Disposable } from "./disposable";
import { GlVertexBuffer, GlElementBuffer } from "./gl-buffer";
import { GlVAOHandle } from "./gl-extension";
import { GlWrapper } from "./gl-wrapper";

export class GlVAO implements Disposable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #vaoHandle: DependsOnDisposedState<GlVAOHandle>;

  private constructor(glWrapper: GlWrapper){
    this.#glWrapper = glWrapper;

    const vaoHandle = glWrapper.ext.vertexArray.createVertexArray();
    if(!vaoHandle){
      const err = glWrapper.context.gl.getError();
      throw new Error(`Failed to create VAO (error code ${err})`);
    }
    this.#vaoHandle = DependsOnDisposedState.validBeforeDisposed(this, vaoHandle);
    this.#disposed = false;
  }

  static create(glWrapper: GlWrapper): GlVAO{
    return new GlVAO(glWrapper);
  }

  bind(): void{
    this.#glWrapper.ext.vertexArray.bindVertexArray(this.#vaoHandle.value);
  }
  
  unbind(): void{
    this.#glWrapper.ext.vertexArray.bindVertexArray(null);
  }

  setAttribute(loc: GLint, vbo: GlVertexBuffer, size: GLuint, type: GLenum, stride: GLuint, offset: GLuint): void{
    this.bind();
    vbo.bind();

    const gl = this.#glWrapper.context.gl;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, type, false, stride, offset);

    vbo.unbind();
    this.unbind();
  }

  bindElementBuffer(ebo: GlElementBuffer): void{
    this.bind();
    ebo.bind();
    this.unbind();
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get vao(): GlVAOHandle{
    return this.#vaoHandle.value;
  }

  get isDisposed(): boolean{
    return this.#disposed;
  }

  dispose(): void{
    if(!this.#disposed){
      this.#glWrapper.ext.vertexArray.deleteVertexArray(this.#vaoHandle.value);
      this.#disposed = true;
    }
  }
}