export function partialUpdate<T>(entity: T, param: Record<keyof T, unknown>, allowedKey: string[]): T {
  for (const key of Object.keys(param)) {

    if (allowedKey.includes(key)) {
      entity[key] = param[key];
    }
  }

  return entity;
}
