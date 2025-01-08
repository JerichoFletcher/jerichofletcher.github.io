export interface Bindable{
  bind(): void;
  unbind(): void;
}

export function usingBindables<T extends Bindable[], U>(o: [...T], f: () => U): U{
  try{
    for(const oi of o)oi.bind();
    return f();
  }finally{
    for(let i = o.length - 1; i >= 0; i--){
      o[i].unbind();
    }
  }
}
