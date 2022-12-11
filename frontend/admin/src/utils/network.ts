enum Method { GET = 'GET', POST = 'POST' };

interface NetworkParams {
  [key: string]: any;
}

export default class Network {
  apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async doMethod(url: string, method: Method, options?: { headers?: NetworkParams, query?: NetworkParams, body?: NetworkParams|FormData }) : Promise<any> {
    const promise = new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();

      request.onload = function() {
        if (this.status === 200) {
          resolve(JSON.parse(this.response));
        } else {
          try {
            reject(JSON.parse(this.response).error);
          } catch (_) {
            reject("Server failed to respond");
          }
        }
      }

      request.onerror = function() {
        reject("Failed to connect to the server");
      }
  
      request.open(method, url, true);
      request.setRequestHeader('X-Api-Key', this.apiKey ?? '');

      for (const key in options?.headers) {
        request.setRequestHeader(key, options?.headers[key]);
      }

      if (options && options.body instanceof FormData) {
        request.send(options?.body);
      } else {
        request.send(JSON.stringify(options?.body));
      }
    });

    return promise;
  }

  async doGet(url: string, options?: { headers?: NetworkParams, query: NetworkParams }) {
    return await this.doMethod(url, Method.GET, options);
  }
  
  async doPost(url: string, options?: { headers?: NetworkParams, body: NetworkParams }) {
    return await this.doMethod(url, Method.POST, options);
  }

  async doFetch(url: string, method: Method, options?: { headers?: NetworkParams, query?: NetworkParams, body?: NetworkParams }) : Promise<any> {
    const promise = new Promise<any>((resolve, reject) => {
      fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...this.apiKey ? { 'X-Api-Key': this.apiKey } : {},
          ...options?.headers ?? {}
        },
        body: JSON.stringify(options?.body)
      })
      .then(async (res) => {
        const response = await res.json();
        if (res.status != 200) {
          return reject(response.error);
        }
  
        resolve(response);
      })
      .catch((_) => reject("Failed to connect to the server"));
    });
  
    return promise;
  }
}
