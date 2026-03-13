Change the bulk upload so it is not gated to authenticated users.
Instead, it should be gated by a secret token that is passed as part of the
JSON, which should now look like:

{ "token": "your-secret-token", "events": [...] }

The secret token value for comparison is stored in the environment variable UPLOAD_SECRET.
