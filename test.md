# ETdb
Spotting the home phoning martians in your app store

## Requirements
  - mongodb 3.2.x
  - **gcc build chain** | e.g. `sudo apt-get install build-essential`
  - **node-gyp** | `sudo npm i -g node-gyp`
  - **sudo**, if you want to use `npm start`

## Install
```bash
git clone https://github.com/rbeer/etdb && cd ./etdb && npm i
```

Copy */config.example.json* to */config.json* and adjust to your environment.
You will need a user account/group that has read/write access to */logs/*. You can set them with "uid" and "gid".
(I know, the install script should handle all of this, but alphas be alpha, amiright? :smirk: )

```bash
./install.js
```

Finally, start the server: `npm start` or directly `./etdb.js` as root.


## API

Just a quick overview, will be replaced with proper docs.
Generally, the server does not send the status (like error or success) in the JSON body. I'm using HTTP status codes to determin that:

 - 200 [OK] | Request was processed as expected.
 - 401 [Unauthorized] | Missing credentials, token or invalid user/password combination.
 - 409 [Conflict] | Occurs when the server can't perform a task. Mostly based on given input, e.g. you try to add an existing user.

 Nonetheless, all responses have at least a "message" field that specifies further.

***/auth***
  - You must **always authenticate** via HTTP Basic Auth **against this endpoint**.
  - *GET* - Responds with a JSON Web Token to authenticated users:

  ```JSON
  {
    "message": "Token for evr'body!",
    "token": "eyJhbGiDh3Ak1zI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImJvYmJ5IiwiYWNjZXNzIjp7ImlzQWRtaW4iOnRydthismFnZVVzZXJzIjp0cnVlLCJyZWFkQVBJisp0cnVlLCJ3cmobviously6dHJ1ZXnotmlhdCI6aTQ3ODgvalidMiwiZXhwIjoxNDc4ODtokenyfQ.fuTa-xsQ47JSwl4La7LqB18R0bQjzuO7CKh5ksbYduh!"
  }
  ```

  - *POST* - Creates a new user, according to application/json body of the request:

  ```JSON
  {
    "username": "newUserToAdd",
    "password": "ddAoTresUwen"
  }
  ```

***/api/*****
  - All **requests must carry a JSON Web Token** for authentication. Available options are:

    - as x-access-token header [preferred]
    - as request body
    - as query string

***/api/v1/***

Nothing special here, yet; just testing the authentication.

***/api/v1/protected***

Nothing special here, yet; just testing the authentication.

