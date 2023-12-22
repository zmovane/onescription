import fs from "fs";
import yaml from 'js-yaml';

export function delay(mills: number) {
  return new Promise(resolve => setTimeout(resolve, mills));
}

export function readYaml<T>(filepath: string): T {
  return yaml.load(fs.readFileSync(filepath, "utf8")) as T
}