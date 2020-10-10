import { CliArgs } from "../../src/core/core-definitions";
import { getGCloudKeyPath } from "../setup/key-exports";
import { readJsonFile, writeJsonFile } from "../../src/util/util";

export const defaultE2EArgs: CliArgs = {
  srcFile: "test-assets/flat-json/count-en.flat.json",
  srcLng: "en",
  srcFormat: "flat-json",
  targetFile: "default-target.json",
  targetLng: "de",
  targetFormat: "nested-json",
  service: "google-translate",
  serviceConfig: getGCloudKeyPath(),
  cacheDir: "test-assets/cache",
  matcher: "none",
  deleteStale: "true",
};

export function buildE2EArgs(args: CliArgs): string {
  const cmdArgs: string[] = [];
  for (const argKey of Object.keys(args)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const argValue: string | undefined = args[argKey];
    if (argValue !== undefined && argKey !== "refTargetFile") {
      cmdArgs.push(`--${argKey}='${argValue}'`);
    }
  }
  return cmdArgs.join(" ");
}

export function injectJsonProperties(
  jsonPath: string,
  inject: Record<string, unknown>
) {
  const json = readJsonFile(jsonPath);
  const injectJson = { ...json, ...inject };
  writeJsonFile(jsonPath, injectJson);
}

export function modifyJsonProperty(args: {
  jsonPath: string;
  index: number;
  newValue: unknown;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json: any = readJsonFile(args.jsonPath);
  const keys = Object.keys(json);
  json[keys[args.index]] = args.newValue;
  writeJsonFile(args.jsonPath, json);
}
