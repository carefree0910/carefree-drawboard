export function bem(b: string, em?: { e?: string; m?: string }): string {
  em ??= {};
  let result = b;
  if (em.e) result = `${result}__${em.e}`;
  if (em.m) result = `${result}--${em.m}`;
  return result;
}

export function genBlock(
  b: string,
): (em?: { e?: string; m?: string } | string, m?: string) => string {
  return (em?, m?) => {
    if (typeof em === "string") {
      return bem(b, { e: em, m });
    }
    return bem(b, em);
  };
}
