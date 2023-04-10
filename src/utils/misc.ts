// {identifier}.{hash}
export function stripHashFromIdentifier(identifierWithHash: string): string {
  return identifierWithHash.split(".").slice(0, -1).join(".");
}
