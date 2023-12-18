export enum AnalyticsConfigKey {
  GA_PROPERTY_ID = 'ga_property_id',
  GA_CLIENT_EMAIL = 'ga_client_email',
  GA_PRIVATE_KEY = 'ga_private_key',
}

export interface AnalyticsConfig {
  ga_property_id: string|null;
  ga_client_email: string|null;
  ga_private_key: string|null;
};
