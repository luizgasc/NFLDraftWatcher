import type {
  FetchDraftProspectsInput,
  RawProspectRecord,
} from "./types";
import type { DraftProviderAdapter } from "./index";

type HttpDraftProviderAdapterConfig<TResponse> = {
  providerName: string;
  endpoint: string;
  headers?: Record<string, string>;
  mapResponse: (
    response: TResponse,
    input: FetchDraftProspectsInput,
  ) => RawProspectRecord[];
};

export function createHttpDraftProviderAdapter<TResponse>(
  config: HttpDraftProviderAdapterConfig<TResponse>,
): DraftProviderAdapter {
  return {
    providerName: config.providerName,
    async fetchProspects(input) {
      const url = new URL(config.endpoint);
      url.searchParams.set("draftYear", String(input.draftYear));

      const response = await fetch(url, {
        headers: config.headers,
        signal: input.signal,
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        throw new Error(
          `Provider ${config.providerName} returned ${response.status}`,
        );
      }

      const data = (await response.json()) as TResponse;

      return config.mapResponse(data, input);
    },
  };
}
