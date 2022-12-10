enum Method { GET = 'GET', POST = 'POST' };

interface NetworkObject {
  [key: string]: any;
}

export default class Network {
  apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async doMethod(url: string, method: Method, options?: { headers?: NetworkObject, query?: NetworkObject, body?: NetworkObject }) : Promise<any> {
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

  async doGet(url: string, options?: { headers?: NetworkObject, query: NetworkObject }) {
    return await this.doMethod(url, Method.GET, options);
  }
  
  async doPost(url: string, options?: { headers?: NetworkObject, body: NetworkObject }) {
    return await this.doMethod(url, Method.POST, options);
  }
}
