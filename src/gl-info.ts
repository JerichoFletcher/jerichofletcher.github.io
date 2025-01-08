import * as E from "./gl-enum";

type GlInfo = {
  readonly name: string;
  readonly size: GLint;
  readonly type: E.DTypeAll;
  readonly elementSize: GLint;
};

export type GlUniformInfo = GlInfo & {
  readonly elementType: E.DTypeNonMulti;
  readonly location: WebGLUniformLocation;
};
export type GlAttributeInfo = GlInfo & {
  readonly elementType: E.DType;
  readonly location: GLint;
};

export function getElementSize(type: E.DTypeAll): number{
  switch(type){
    case E.DTypeVec.Float2:
    case E.DTypeVec.Int2:
    case E.DTypeVec.Bool2:
      return 2;
    case E.DTypeVec.Float3:
    case E.DTypeVec.Int3:
    case E.DTypeVec.Bool3:
      return 3;
    case E.DTypeVec.Float4:
    case E.DTypeVec.Int4:
    case E.DTypeVec.Bool4:
    case E.DTypeMat.FloatM2:
      return 4;
    case E.DTypeMat.FloatM3:
      return 9;
    case E.DTypeMat.FloatM4:
      return 16;
    default:
      if(type in E.DType || type in E.DTypeSampler)return 1;
      throw new Error(`Unknown GL type: ${type}`);
  }
}

export function getElementType(type: E.DTypeAll): E.DTypeNonMulti{
  switch(type){
    case E.DTypeVec.Float2:
    case E.DTypeVec.Float3:
    case E.DTypeVec.Float4:
    case E.DTypeMat.FloatM2:
    case E.DTypeMat.FloatM3:
    case E.DTypeMat.FloatM4:
      return E.DType.Float;
    case E.DTypeVec.Bool2:
    case E.DTypeVec.Bool3:
    case E.DTypeVec.Bool4:
      return E.DType.Bool;
    case E.DTypeVec.Int2:
    case E.DTypeVec.Int3:
    case E.DTypeVec.Int4:
      return E.DType.Int;
    default:
      if(type in E.DType || type in E.DTypeSampler)return type;
      throw new Error(`Unknown GL type: ${type}`);
  }
}

export function getInfo(info: WebGLActiveInfo): GlInfo{
  const elementSize = getElementSize(info.type);

  return {
    name: info.name,
    size: info.size,
    type: info.type,
    elementSize,
  };
}

export function getUniformInfo(info: WebGLActiveInfo, location: WebGLUniformLocation): GlUniformInfo{
  const elementType = getElementType(info.type);
  
  return {
    ...getInfo(info),
    elementType,
    location,
  };
}

export function getAttribInfo(info: WebGLActiveInfo, location: GLint): GlAttributeInfo{
  const elementType = getElementType(info.type);
  
  if(elementType in E.DType){
    const x = elementType as E.DType;
    return {
      ...getInfo(info),
      elementType: x,
      location,
    };
  }
  
  throw new Error(`Invalid attribute GL type ${elementType}`);
}
