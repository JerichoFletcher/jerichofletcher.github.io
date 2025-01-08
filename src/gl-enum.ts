export enum BufferType{
  Array = 34962,
  Element = 34963,
}

export enum BufferDataUsage{
  Stream = 35040,
  Static = 35044,
  Dynamic = 35048,
}

export enum DType{
  Byte = 5120,
  UByte = 5121,
  Short = 5122,
  UShort = 5123,
  Int = 5124,
  UInt = 5125,
  Float = 5126,
  Bool = 35670,
}

export enum DTypeVec{
  Float2 = 35664,
  Float3 = 35665,
  Float4 = 35666,
  Int2 = 35667,
  Int3 = 35668,
  Int4 = 35669,
  Bool2 = 35671,
  Bool3 = 35672,
  Bool4 = 35673,
}

export enum DTypeMat{
  FloatM2 = 35674,
  FloatM3 = 35675,
  FloatM4 = 35676,
}

export enum DTypeSampler{
  Sampler2D = 35678,
  SamplerCube = 35680,
}

export type DTypeMulti = DTypeVec | DTypeMat;
export type DTypeNonMulti = DType | DTypeSampler;
export type DTypeNonSampler = DType | DTypeMulti;
export type DTypeAll = DTypeNonSampler | DTypeSampler;

export enum DrawMode{
  Points = 0,
  Lines = 1,
  LineLoop = 2,
  LineStrip = 3,
  Triangles = 4,
  TriangleStrip = 5,
  TriangleFan = 6,
}

export enum ShaderType{
  Fragment = 35632,
  Vertex = 35633,
}

export enum TextureWrap{
  Repeat = 10497,
  ClampToEdge = 33071,
  MirroredRepeat = 33648,
}

export enum TextureMinFilter{
  Nearest = 9728,
  Linear = 9729,
  NearestMipmapNearest = 9984,
  LinearMipmapNearest = 9985,
  NearestMipmapLinear = 9986,
  LinearMipmapLinear = 9987,
}

export enum TextureMagFilter{
  Nearest = 9728,
  Linear = 9729,
}
