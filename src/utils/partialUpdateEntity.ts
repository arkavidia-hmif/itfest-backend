export function partialUpdate(entity: any, param: any, allowedKey: string[]): object {
  for (const key of Object.keys(param)) {

    if (allowedKey.includes(key)) {
      entity[key] = param[key];
    }
  }

  return entity;
}
