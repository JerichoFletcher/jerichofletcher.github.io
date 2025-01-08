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

  private executeWhenValid<U>(f: () => U): U{
    switch(this.#validWhen){
      case ValidWhen.BeforeDisposed:
        if(this.#parent.isDisposed)throw new Error("Invalid state: Already disposed");
        return f();
      case ValidWhen.AfterDisposed:
        if(!this.#parent.isDisposed)throw new Error("Invalid state: Not disposed");
        return f();
    }
  }

  get value(): T{
    return this.executeWhenValid(() => this.#val);
  }

  set value(val: T){
    this.executeWhenValid(() => this.#val = val);
  }
}

export function usingDisposables<T extends Disposable[], U>(o: [...T], f: () => U): U{
  try{
    return f();
  }finally{
    for(let i = o.length - 1; i >= 0; i--){
      o[i].dispose();
    }
  }
}
