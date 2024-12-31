enum ValidWhen{
  BeforeDisposed,
  AfterDisposed,
}

export interface Disposable{
  get isDisposed(): boolean;
  dispose(): void;
}

export class DependsOnDisposedState<T>{
  #parent: Disposable;
  #validWhen: ValidWhen;
  #val: T;

  private constructor(parent: Disposable, validWhen: ValidWhen, val: T){
    this.#parent = parent;
    this.#validWhen = validWhen;
    this.#val = val;
  }

  static validBeforeDisposed<T, U extends Disposable>(parent: U, val: T){
    return new DependsOnDisposedState(parent, ValidWhen.BeforeDisposed, val);
  }

  static validAfterDisposed<T, U extends Disposable>(parent: U, val: T){
    return new DependsOnDisposedState(parent, ValidWhen.AfterDisposed, val);
  }

  private executeWhenValid(f: Function){
    switch(this.#validWhen){
      case ValidWhen.BeforeDisposed:
        if(this.#parent.isDisposed)throw new Error("Invalid state: Already disposed");
        return f();
      case ValidWhen.AfterDisposed:
        if(!this.#parent.isDisposed)throw new Error("Invalid state: Not disposed");
        return f();
    }
  }

  get value(){
    return this.executeWhenValid(() => this.#val) as T;
  }

  set value(val: T){
    this.executeWhenValid(() => this.#val = val);
  }
}

export function using<T extends Disposable[], U>(o: [...T], f: (...args: T) => U){
  try{
    return f(...o);
  }finally{
    for(let i = o.length - 1; i >= 0; i--){
      o[i].dispose();
    }
  }
}
