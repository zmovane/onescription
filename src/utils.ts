export function delay(mills: number) {
  return new Promise(resolve => setTimeout(resolve, mills));
}