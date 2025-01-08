import { GlWrapper } from "./gl-wrapper";

type GlInfo = {
  readonly name: string;
  readonly size: GLint;
  readonly type: GLenum;
  readonly elementSize: GLint;
  readonly elementType: GLenum;
};

export type GlUniformInfo = GlInfo & { readonly location: WebGLUniformLocation };
export type GlAttributeInfo = GlInfo & { readonly location: GLint };

export function getElementSize(glWrapper: GlWrapper, type: GLenum): number{
  switch(type){
    case glWrapper.context.gl.FLOAT:
    case glWrapper.context.gl.UNSIGNED_BYTE:
    case glWrapper.context.gl.UNSIGNED_SHORT:
    case glWrapper.context.gl.UNSIGNED_INT:
    case glWrapper.context.gl.BYTE:
    case glWrapper.context.gl.SHORT:
    case glWrapper.context.gl.INT:
    case glWrapper.context.gl.BOOL:
      return 1;
    case glWrapper.context.gl.FLOAT_VEC2:
    case glWrapper.context.gl.INT_VEC2:
    case glWrapper.context.gl.BOOL_VEC2:
      return 2;
    case glWrapper.context.gl.FLOAT_VEC3:
    case glWrapper.context.gl.INT_VEC3:
    case glWrapper.context.gl.BOOL_VEC3:
      return 3;
    case glWrapper.context.gl.FLOAT_VEC4:
    case glWrapper.context.gl.INT_VEC4:
    case glWrapper.context.gl.BOOL_VEC4:
    case glWrapper.context.gl.FLOAT_MAT2:
      return 4;
    case glWrapper.context.gl.FLOAT_MAT3:
      return 9;
    case glWrapper.context.gl.FLOAT_MAT4:
      return 16;
    default:
      throw new Error(`Unknown GL type: ${type}`);
  }
}

export function getElementType(glWrapper: GlWrapper, type: GLenum): GLenum{
  switch(type){
    case glWrapper.context.gl.FLOAT_VEC2:
    case glWrapper.context.gl.FLOAT_VEC3:
    case glWrapper.context.gl.FLOAT_VEC4:
    case glWrapper.context.gl.FLOAT_MAT2:
    case glWrapper.context.gl.FLOAT_MAT3:
    case glWrapper.context.gl.FLOAT_MAT4:
      return glWrapper.context.gl.FLOAT;
    case glWrapper.context.gl.BOOL_VEC2:
    case glWrapper.context.gl.BOOL_VEC3:
    case glWrapper.context.gl.BOOL_VEC4:
      return glWrapper.context.gl.BOOL;
    case glWrapper.context.gl.INT_VEC2:
    case glWrapper.context.gl.INT_VEC3:
    case glWrapper.context.gl.INT_VEC4:
      return glWrapper.context.gl.INT;
    case glWrapper.context.gl.BYTE:
    case glWrapper.context.gl.SHORT:
    case glWrapper.context.gl.INT:
    case glWrapper.context.gl.UNSIGNED_BYTE:
    case glWrapper.context.gl.UNSIGNED_SHORT:
    case glWrapper.context.gl.UNSIGNED_INT:
    case glWrapper.context.gl.FLOAT:
    case glWrapper.context.gl.BOOL:
      return type;
    default:
      throw new Error(`Unknown GL type: ${type}`);
  }
}

export function getInfo(glWrapper: GlWrapper, info: WebGLActiveInfo): GlInfo{
  const elementSize = getElementSize(glWrapper, info.type);
  const elementType = getElementType(glWrapper, info.type);

  return {
    name: info.name,
    size: info.size,
    type: info.type,
    elementSize,
    elementType,
  };
}

export function getUniformInfo(glWrapper: GlWrapper, info: WebGLActiveInfo, location: WebGLUniformLocation): GlUniformInfo{
  return {
    ...getInfo(glWrapper, info),
    location,
  };
}

export function getAttribInfo(glWrapper: GlWrapper, info: WebGLActiveInfo, location: GLint): GlAttributeInfo{
  return {
    ...getInfo(glWrapper, info),
    location,
  };
}
