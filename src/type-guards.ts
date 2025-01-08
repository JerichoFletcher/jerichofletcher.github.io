export function isArrayOf<T>(arr: unknown, pred: (item: unknown) => item is T): arr is T[]{
  return Array.isArray(arr) && arr.every(pred);
}

export function isNumberArray(arr: unknown): arr is number[]{
  return isArrayOf(arr, item => typeof item === "number");
}

export function isBoolArray(arr: unknown): arr is boolean[]{
  return isArrayOf(arr, item => typeof item === "boolean");
}
