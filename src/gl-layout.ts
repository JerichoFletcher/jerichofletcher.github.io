import { GlVertexBuffer } from "./gl-buffer";
import { GlProgram } from "./gl-shader-program";
import { GlVAO } from "./gl-vao";
import { GlWrapper } from "./gl-wrapper";

export type LayoutConfig = {
  attribName: string;
  targetBuffer: GlVertexBuffer;
  normalized?: boolean;
  stride: GLuint;
  offset: GLuint;
};

export class GlBufferLayout{
  #glWrapper: GlWrapper;
  #configs: Map<string, LayoutConfig>;

  constructor(glWrapper: GlWrapper){
    this.#glWrapper = glWrapper;
    this.#configs = new Map();
  }

  setAttribute(...configs: LayoutConfig[]): void{
    for(const conf of configs){
      this.#configs.set(conf.attribName, conf);
    }
  }

  configure(vao: GlVAO, program: GlProgram): void{
    for(const info of program.attributes.values()){
      const conf = this.#configs.get(info.name);
      if(!conf)throw new Error(`Attribute ${info.name} not defined by the layout`);

      vao.setAttribute(
        info.location,
        conf.targetBuffer,
        info.elementSize,
        info.elementType,
        conf.normalized ?? false,
        conf.stride,
        conf.offset,
      );
    }
  }

  get contextWrapper(): GlWrapper{
    return this.#glWrapper;
  }

  get configs(): ReadonlyMap<string, LayoutConfig>{
    return this.#configs;
  }
}