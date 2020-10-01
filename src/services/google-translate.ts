import { TranslationServiceClient } from "@google-cloud/translate";
import {
  replaceInterpolations,
  reInsertInterpolations,
} from "../matchers/matcher-definitions";
import {
  TResult,
  TService,
  TServiceArgs,
  TString,
} from "./service-definitions";
import { google } from "@google-cloud/translate/build/protos/protos";
import ITranslateTextRequest = google.cloud.translation.v3.ITranslateTextRequest;
import { ClientOptions } from "google-gax";
import ITranslation = google.cloud.translation.v3.ITranslation;
import { getDebugPath, logFatal, readJsonFile } from "../util/util";

interface GCloudKeyFile {
  project_id: string;
}

export class GoogleTranslate implements TService {
  // eslint-disable-next-line require-await
  async translateStrings(args: TServiceArgs) {
    const keyFile = readJsonFile<GCloudKeyFile>(args.serviceConfig);
    if (!keyFile.project_id) {
      logFatal(
        `${getDebugPath(args.serviceConfig)} does not contain a project_id`
      );
    }
    const projectId: string = keyFile.project_id;
    const location = "global";

    const clientOptions: ClientOptions = {
      keyFile: args.serviceConfig,
    };
    const client = new TranslationServiceClient(clientOptions);

    const interpols = args.strings.map((tString) => {
      return replaceInterpolations(tString.value, args.interpolationMatcher);
    });
    const cleanStrings = interpols.map((v) => v.clean);
    const request: ITranslateTextRequest = {
      parent: `projects/${projectId}/locations/${location}`,
      contents: cleanStrings,
      mimeType: "text/plain",
      sourceLanguageCode: args.srcLng,
      targetLanguageCode: args.targetLng,
    };
    const [response] = await client.translateText(request);

    // TODO: Error handling
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return response.translations!.map((value, index) => {
      return this.transformGCloudResult(
        value,
        args.strings[index],
        interpols[index].replacements
      );
    });
  }

  transformGCloudResult(
    result: ITranslation,
    input: TString,
    replacements: { from: string; to: string }[]
  ): TResult {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const rawTranslation = result!.translatedText!; // TODO: Error handling
    const cleanTranslation = reInsertInterpolations(
      rawTranslation,
      replacements
    );
    return {
      key: input.key,
      translated: cleanTranslation,
    };
  }
}
