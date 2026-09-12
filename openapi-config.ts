import type { ConfigFile } from '@rtk-query/codegen-openapi';

/**
 * Generates RTK Query endpoints from the contract. The output is committed so that a
 * checkout builds without running codegen, and a contract change shows up as a reviewable
 * diff rather than a silent behaviour change.
 */
const config: ConfigFile = {
  schemaFile: './src/contract/openapi.yaml',
  apiFile: './src/api/api.ts',
  apiImport: 'api',
  outputFile: './src/api/generated/endpoints.ts',
  exportName: 'voltiqueApi',
  hooks: { queries: true, lazyQueries: true, mutations: true },
  // Derives providesTags and invalidatesTags from the OpenAPI tags, which is why the
  // tag names in the contract match the tagTypes declared on the api slice.
  tag: true,
};

export default config;
