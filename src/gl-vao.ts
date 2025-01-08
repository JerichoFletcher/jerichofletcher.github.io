import { DependsOnDisposedState, Disposable } from "./intfs/disposable";
import { GlVertexBuffer, GlElementBuffer } from "./gl-buffer";
import { GlVAOHandle } from "./gl-functions";
import { GlWrapper } from "./gl-wrapper";
import { Bindable, usingBindables } from "./intfs/bindable";
import * as E from "./gl-enum";
import { GlProgram } from "./gl-shader-program";

export class GlVAO implements Disposable, Bindable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #vaoHandle: DependsOnDisposedState<GlVAOHandle>;

  private constructor(glWrapper: GlWrapper){
    this.#glWrapper = glWrapper;

    const vaoHandle = glWrapper.funcs.vertexArray.createVertexArray();
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
    this.#glWrapper.funcs.vertexArray.bindVertexArray(this.#vaoHandle.value);
  }
  
  unbind(): void{
    this.#glWrapper.funcs.vertexArray.bindVertexArray(null);
  }

  setAttribute(loc: GLint, vbo: GlVertexBuffer, size: GLuint, type: E.DType, normalized: boolean, stride: GLuint, offset: GLuint): void{
    usingBindables([this, vbo], () => {
      const gl = this.#glWrapper.context.gl;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, type, normalized, stride, offset);
    });
  }

  bindElementBuffer(ebo: GlElementBuffer): void{
    usingBindables([this], () => ebo.bind());
    ebo.unbind();
  }

  drawElements(program: GlProgram, mode: E.DrawMode, count: GLsizei, type: E.DType, offset: GLintptr): void{
    usingBindables([program, this], () => this.#glWrapper.context.gl.drawElements(mode, count, type, offset));
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
      this.#glWrapper.funcs.vertexArray.deleteVertexArray(this.#vaoHandle.value);
      this.#disposed = true;
    }
  }
}