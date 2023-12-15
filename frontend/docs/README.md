# Vibrance Documentation

This page contains the documnetation on how to communicate with this application through API calls. The official project can be found on my [GitHub repository](https://github.com/therealsujitk/web-app-vibrance), any issues are recommended to be opened here as I'll probably respond much faster there than on email.

### API Endpoints

All endpoints are of the format `/api/<VERSION>/<API_PATH>`, where `<VERSION>` should be replaced with any version you'd like to use (preferably the latest one available). A list of available versions can be found [here](https://github.com/therealsujitk/web-app-vibrance/tree/main/api).

> **Note:** Technically `<VERSION>` can be replaced with `latest` as well, however I **highly** recommend not doing so.

Incase an incorrect version is used you'll get an `application/json` response that looks like this.

```json
{
    "errors": [
        {
            "message": "Invalid API version in URI."
        }
    ]
}
```

Incase the endpoint or request method used is invalid, you'll get an `application/json` response that looks like this.

```json
{
    "errors": [
        {
            "message": "Invalid API endpoint or request method used."
        }
    ]
}
```

### Application Installation

No installation is required to test this API, you can use this site as the base url for your API requests. However to use your own data you'll have to install this application, instructions for which can be found in my repository. You can then sign in to the admin panel to add your own data.
