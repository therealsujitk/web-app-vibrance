enum Method { GET = 'GET', POST = 'POST' };

async function doMethod(url: string, method: Method, body: Object) : Promise<any> {
  const promise = new Promise<any>((resolve, reject) => {
    fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
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

export async function doGet(url: string, body: Object) {
  return await doMethod(url, Method.GET, body);
}

export async function doPost(url: string, body: Object) {
  return await doMethod(url, Method.POST, body);
}
