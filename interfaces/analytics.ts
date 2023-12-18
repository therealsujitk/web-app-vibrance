import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { query, transaction } from '../config/db';
import Activities from './audit-log';
import { AnalyticsConfigKey, AnalyticsConfig } from '../models/analytics';
import { LogAction } from '../models/log-entry';

export default class Analytics {
  userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  private async getConfig() {
    const result = await query("SELECT * FROM `settings` WHERE `key` IN (?)", [Object.keys(AnalyticsConfigKey)]);
    const config: AnalyticsConfig = {
      ga_property_id: null,
      ga_client_email: null,
      ga_private_key: null,
    };

    result.forEach((r: any) => config[r.key as AnalyticsConfigKey] = r.value);
    return config as AnalyticsConfig;
  }

  async setConfig(config: AnalyticsConfig) {
    const queries = [];

    for (let key in config) {
      queries.push({
        query: "UPDATE `settings` SET `value` = ? WHERE `key` = ?",
        options: [config[key as AnalyticsConfigKey], key]
      });
    }

    queries.push(Activities.createInsertQuery({
      actor: this.userId,
      action: LogAction.SETTINGS_EDIT,
    }));

    await transaction(queries);
  }

  async deleteConfig() {
    const queries = [
      {
        query: "UPDATE `settings` SET `value` = NULL WHERE `key` IN (?)",
        options: [Object.keys(AnalyticsConfigKey)]
      },
      Activities.createInsertQuery({
        actor: this.userId,
        action: LogAction.SETTINGS_EDIT,
      })
    ];

    await transaction(queries);
  }

  async get() {
    const config = await this.getConfig();

    if (config.ga_property_id === null) {
      return null;
    }

    const propertyId = config.ga_property_id;
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: config.ga_client_email!,
        private_key: config.ga_private_key!,
      }
    });

    const metrics = ['totalUsers', 'newUsers', 'averageSessionDuration'];

    const dateQuery = {
      dateRanges: [
        {
          startDate: '13daysAgo',
          endDate: 'today',
        },
      ],
      dimensions: [
        {
          name: 'date',
        },
      ],
      metrics: metrics.map(m => ({name: m})),
      orderBys: [
        {
          dimension: {
            dimensionName: 'date',
          },
          desc: true,
        }
      ],
    };
  
    const oldWeekQuery = {
      dateRanges: [
        {
          startDate: '13daysAgo',
          endDate: '7daysAgo',
        },
      ],
      metrics: metrics.map(m => ({name: m})),
    };
  
    const newWeekQuery = {
      dateRanges: [
        {
          startDate: '6daysAgo',
          endDate: 'today',
        },
      ],
      metrics: metrics.map(m => ({name: m})),
    };

    const [response] = await analyticsDataClient.batchRunReports(
      { property: `properties/${propertyId}`, requests: [dateQuery, oldWeekQuery, newWeekQuery] }
    );

    const data = [
      {
        name: "Total users",
        data: response.reports![0].rows!.map(row => ({
          date: Number(row.dimensionValues![0].value),
          value: Number(row.metricValues![0].value),
        })),
        weekData: {
          oldValue: Number(response.reports![1].rows![0].metricValues![0].value),
          newValue: Number(response.reports![2].rows![0].metricValues![0].value),
        }
      },
      {
        name: "New users",
        data: response.reports![0].rows!.map(row => ({
          date: Number(row.dimensionValues![0].value),
          value: Number(row.metricValues![1].value),
        })),
        weekData: {
          oldValue: Number(response.reports![1].rows![0].metricValues![1].value),
          newValue: Number(response.reports![2].rows![0].metricValues![1].value),
        }
      },
      {
        name: "Avg. session duration",
        data: response.reports![0].rows!.map(row => ({
          date: Number(row.dimensionValues![0].value),
          value: Number(row.metricValues![2].value),
        })),
        weekData: {
          oldValue: Number(response.reports![1].rows![0].metricValues![2].value),
          newValue: Number(response.reports![2].rows![0].metricValues![2].value),
        }
      }
    ];

    return data;
  }
}
