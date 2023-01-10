import { BetaAnalyticsDataClient } from '@google-analytics/data';

const propertyId = '343353246';
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: 'service-account@vitvibrance.iam.gserviceaccount.com',
    private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDi90Ye1pRrNqY6\nuQDSsicNAGjp/8LDm4/irp4IbeYSmr/66oYTUwdd9LQuINhluqAsLQdlXmZRyzLx\nk1vL2Kn2ZF56vhnExRytfNP9Bb0ULvRlCF+9U36msUpqfM9yrp7vRWqjopEolzzN\nSWR+6MXqxqSTTntEc6xlZitgbI6Gz7+Fmf5cVcA80o4DOzb4i3CNzWf2Cp13BR6U\nnmqyC9ccfFNJP0w/aXsDzWP+tmJnmQR3vTHsrtqDmKr6zYJq5BRWPqVIwBJbgEw3\nHUIsZ6Ysw4CjV50xtYcuEvYL/43rMUbBNeiX6zT0CqtR4uWByroEmeU6XPmsvjQ5\nZp+/nKXlAgMBAAECggEAAVUbzYcLeISp3arj4RjIJ2ii9Qq6GT1izx0g0uJYSTAs\n49t4HYltf+T1oNazBofdtFywUC1Jcv37JtVrYss7FjX5IwXWL2RL2o3izbe4qDNt\nXmF59GnW0sI0MmNYsW7qgnOZIGxOJ1uZ8QeXBjK2JL51TWMW0KxQLQk4RHjmrk5r\nlu0ZnTj/k5EaEw8veAW6EAYVt7CFVmU9P3DB8jy6/eKdNkmCnDWs+Gfg8bZAWDZ3\n/U121zr1fBcS5a6fjpN/FYzF1ux1npbJ0zsO3DkcbA1mP6K7fOuJDOTRvHCk8UGm\nRgYJALURdKuEXNQ88k0l+rvOTgDGEL8PPzbyXa3SOQKBgQD/TXiFSPF1N/iNZnvZ\nXAGjbFGbA4+gEEeAT5pbF3te92hmgigX+pk0Y5fDdY1pApOmsx3hKnlTyM08ahvo\nxT5tj+CYXG72N7ZEbQGiUEv6c6eKdXIqjhqW8ni6DS6L2Zq4qujlDgj7P1FwxZDy\ngKoI6fQRpzDyWJayBlqN3hWsTQKBgQDjlfzZ1pontg2kBN7zrgpTs27/f7ZbG4DO\n416gUxYORkaYLOkHivxnLLPQYcX2lzbNM++QK/grYBl0Yhq8R6DjIEl/ZuDM7coW\najTZD4bdWb9xFR/AYrdnDEgkM8rugaQs1A7I0zF2QyFWQ2U6VrsJWAEfYzahA+T5\n8wsEqAPL+QKBgBo4j7dIvZvnarzDGNdDLtvlBSChpf+vjFhuVJEkgURIrs1QcuO7\nlj6eN/kYOrTdUeLeJKR6o0lqp0GcOE+Y6oeALnYXkEHziOHQPEm6a4NGm5+J3nbm\nb26vapzZO72bVNvAmfjkjyGW6Dtn3zI46r3NoYaqoElTte6E3ooRlDJFAoGARLr3\nMZJt27BPTklqS40z8TMvQln/aGRV8iUYXrK45nayuyJU/cIrl70YUMY2UtI36qDU\nqGWe/Pp4tX0rNdEr9Wu6xo77NOhbL4nDjAn0YMTJ3AzVGfS2DpjW8JfzoTPlsOQZ\n0ux085IybyrLV2L5+UhqjmAYD2htrk6H9VAIVYECgYBf5tB9HzOIW0h491KXaz1u\nvTjxD18ktpVduz75pDRjuaRGp4COhPXc8qOlgguVcizbe7pji7PMmD5qYGuoZyVE\nN4F69bOlsu9udw92GYrz1ZORcIE64vu9cEVXDsJAb5p8/mi1iFMQENgCbInDByN7\nsjw6hzzwuemmEvRC9JAA2g==\n-----END PRIVATE KEY-----\n'
  }
});

async function runReport() {
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
    metrics: [
      {
        name: 'activeUsers',
      },
      {
        name: 'newUsers',
      },
      {
        name: 'userEngagementDuration',
      },
    ],
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
    metrics: [
      {
        name: 'activeUsers',
      },
      {
        name: 'newUsers',
      },
      {
        name: 'userEngagementDuration',
      },
    ],
  };

  const newWeekQuery = {
    dateRanges: [
      {
        startDate: '6daysAgo',
        endDate: 'today',
      },
    ],
    metrics: [
      {
        name: 'activeUsers',
      },
      {
        name: 'newUsers',
      },
      {
        name: 'userEngagementDuration',
      },
    ],
  };

  const [response] = await analyticsDataClient.batchRunReports(
    { property: `properties/${propertyId}`, requests: [dateQuery, oldWeekQuery, newWeekQuery] }
  );

  const data = [
    {
      name: "Active users",
      data: response.reports![0].rows!.map(row => ({
        date: row.dimensionValues![0].value,
        value: row.metricValues![0].value
      })),
      weekData: {
        oldValue: response.reports![1].rows![0].metricValues![0].value,
        newValue: response.reports![2].rows![0].metricValues![0].value,
      }
    },
    {
      name: "New users",
      data: response.reports![0].rows!.map(row => ({
        date: row.dimensionValues![0].value,
        value: row.metricValues![1].value
      })),
      weekData: {
        oldValue: response.reports![1].rows![0].metricValues![1].value,
        newValue: response.reports![2].rows![0].metricValues![1].value,
      }
    },
    {
      name: "User engagement duration",
      data: response.reports![0].rows!.map(row => ({
        date: row.dimensionValues![0].value,
        value: row.metricValues![2].value
      })),
      weekData: {
        oldValue: response.reports![1].rows![0].metricValues![2].value,
        newValue: response.reports![2].rows![0].metricValues![2].value,
      }
    }
  ]

  console.log(JSON.stringify(data));
}

runReport();
