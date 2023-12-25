export function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function delay(mills: number) {
  return new Promise(resolve => setTimeout(resolve, mills));
}