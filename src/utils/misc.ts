// {identifier}.{hash}
export function stripHashFromIdentifier(identifierWithHash: string): string {
  return identifierWithHash.split(".").slice(0, -1).join(".");
}

export function isDate(time: Date | number) {
  return time instanceof Date;
}
export function formatTime(time: Date | number, pattern = "YYYY-MM-DD HH:mm:ss") {
  const dateTime: Date = !isDate(time) ? new Date(time) : (time as Date);
  const year = dateTime.getFullYear();
  const month = `00${dateTime.getMonth() + 1}`.slice(-2);
  const day = `00${dateTime.getDate()}`.slice(-2);
  const hour = `00${dateTime.getHours()}`.slice(-2);
  const min = `00${dateTime.getMinutes()}`.slice(-2);
  const sec = `00${dateTime.getSeconds()}`.slice(-2);
  return pattern
    .replace("YYYY", year.toString())
    .replace("MM", month)
    .replace("DD", day)
    .replace("HH", hour)
    .replace("mm", min)
    .replace("ss", sec);
}
