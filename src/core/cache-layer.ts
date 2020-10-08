import { fileFormatMap } from "../file-formats/file-format-definitions";
import { CliArgs, CoreResults, TSet } from "./core-definitions";
import { existsSync } from "fs";
import { checkDir, getDebugPath } from "../util/util";
import path from "path";

function resolveCachePath(args: CliArgs): string {
  const cacheDir = args.cacheDir;
  checkDir(cacheDir);
  const baseName = path.basename(args.srcFile);
  const cacheName = `attranslate-cache-${args.srcLng}_${baseName}.json`;
  return path.resolve(cacheDir, cacheName);
}

const cacheFileFormat = fileFormatMap["flat-json"];

const cacheMarkingKey = "generated-by-attranslate";

export function resolveTCache(args: CliArgs): TSet | null {
  const cachePath = resolveCachePath(args);
  if (!existsSync(cachePath)) {
    return null;
  }
  const rawCache = cacheFileFormat.readTFile(cachePath, args.srcLng);
  if (rawCache.get(cacheMarkingKey)) {
    rawCache.delete(cacheMarkingKey);
  }
  return rawCache;
}

function getCacheWarning(args: CliArgs): string {
  return `Do not edit this file manually! You may want to edit '${args.srcFile}' instead.`;
}

export function writeTCache(results: CoreResults, args: CliArgs) {
  const cachePath = resolveCachePath(args);
  console.info(`Write cache ${getDebugPath(cachePath)}`);

  const rawCache: TSet = new Map();
  rawCache.set(cacheMarkingKey, getCacheWarning(args));
  results.newSrcCache.forEach((value, key) => {
    rawCache.set(key, value);
  });
  cacheFileFormat.writeTFile(cachePath, rawCache);
}
