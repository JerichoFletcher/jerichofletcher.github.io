import { DependsOnDisposedState, Disposable } from "./disposable";
import { GlWrapper } from "./gl-wrapper";

export enum BufferType{
  Array,
  Element,
}

export enum BufferDataUsage{
  Static,
  Dynamic,
  Stream,
}

export type GlVertexBuffer = GlBuffer & { type: BufferType.Array };
export type GlElementBuffer = GlBuffer & { type: BufferType.Element };

export class GlBuffer implements Disposable{
  #disposed: boolean;
  #glWrapper: GlWrapper;
  #type: BufferType;
  #usage: BufferDataUsage;
  #bufHandle: DependsOnDisposedState<WebGLBuffer>;

  private constructor(glWrapper: GlWrapper, type: BufferType, usage: BufferDataUsage){
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

  static create(glWrapper: GlWrapper, type: BufferType.Array, usage: BufferDataUsage): GlVertexBuffer;
  static create(glWrapper: GlWrapper, type: BufferType.Element, usage: BufferDataUsage): GlElementBuffer;
  static create(glWrapper: GlWrapper, type: BufferType, usage: BufferDataUsage){
    return new GlBuffer(glWrapper, type, usage);
  }

  private get target(): GLenum{
    switch(this.#type){
      case BufferType.Array: return this.#glWrapper.context.gl.ARRAY_BUFFER;
      case BufferType.Element: return this.#glWrapper.context.gl.ELEMENT_ARRAY_BUFFER;
    }
  }

  private get usage(): GLenum{
    switch(this.#usage){
      case BufferDataUsage.Static: return this.#glWrapper.context.gl.STATIC_DRAW;
      case BufferDataUsage.Dynamic: return this.#glWrapper.context.gl.DYNAMIC_DRAW;
      case BufferDataUsage.Stream: return this.#glWrapper.context.gl.STREAM_DRAW;
    }
  }

  bind(): void{
    const buf = this.#bufHandle.value;
    this.#glWrapper.context.gl.bindBuffer(this.target, buf);
  }

  unbind(): void{
    this.#glWrapper.context.gl.bindBuffer(this.target, null);
  }

  setData(data: AllowSharedBufferSource | null): void{
    this.bind();
    this.#glWrapper.context.gl.bufferData(this.target, data, this.usage);
    this.unbind();
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get type(): BufferType{
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
      this.#glWrapper.context.gl.deleteBuffer(this.#bufHandle);
      this.#disposed = true;
    }
  }
}