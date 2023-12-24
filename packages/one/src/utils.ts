export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function delay(mills: number) {
  return new Promise(resolve => setTimeout(resolve, mills));
}