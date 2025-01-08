import { DependsOnDisposedState, Disposable } from "./intfs/disposable";
import { GlWrapper } from "./gl-wrapper";
import { Bindable, usingBindables } from "./intfs/bindable";
import * as E from "./gl-enum";

export type GlVertexBuffer = GlBuffer & { type: E.BufferType.Array };
export type GlElementBuffer = GlBuffer & { type: E.BufferType.Element };

export class GlBuffer implements Disposable, Bindable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #type: E.BufferType;
  #usage: E.BufferDataUsage;
  #bufHandle: DependsOnDisposedState<WebGLBuffer>;

  private constructor(glWrapper: GlWrapper, type: E.BufferType, usage: E.BufferDataUsage){
    this.#glWrapper = glWrapper;
    this.#type = type;
    this.#usage = usage;

    const bufHandle = glWrapper.context.gl.createBuffer();
    if(!bufHandle){
      const err = glWrapper.context.gl.getError();
      throw new Error(`Failed to create buffer object (error code: ${err})`);
    }
    this.#bufHandle = DependsOnDisposedState.validBeforeDisposed(this, bufHandle);
    this.#disposed = false;
  }

  static create(glWrapper: GlWrapper, type: E.BufferType.Array, usage: E.BufferDataUsage, data?: AllowSharedBufferSource): GlVertexBuffer;
  static create(glWrapper: GlWrapper, type: E.BufferType.Element, usage: E.BufferDataUsage, data?: AllowSharedBufferSource): GlElementBuffer;
  static create(glWrapper: GlWrapper, type: E.BufferType, usage: E.BufferDataUsage, data?: AllowSharedBufferSource){
    const buf = new GlBuffer(glWrapper, type, usage);
    if(data)buf.setData(data);

    return buf;
  }

  bind(): void{
    const buf = this.#bufHandle.value;
    this.#glWrapper.context.gl.bindBuffer(this.#type, buf);
  }

  unbind(): void{
    this.#glWrapper.context.gl.bindBuffer(this.#type, null);
  }

  setData(data: AllowSharedBufferSource | null): void{
    usingBindables([this], () => this.#glWrapper.context.gl.bufferData(this.#type, data, this.#usage));
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get type(): E.BufferType{
    return this.#type;
  }

  get buffer(): WebGLBuffer{
    return this.#bufHandle.value;
  }

  get isDisposed(): boolean{
    return this.#disposed;
  }

  dispose(): void{
    if(!this.#disposed){
      this.#glWrapper.context.gl.deleteBuffer(this.#bufHandle.value);
      this.#disposed = true;
    }
  }
}