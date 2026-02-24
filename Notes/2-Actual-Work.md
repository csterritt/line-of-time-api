The initial-search.ts file now uses the getEventByReferenceUrl function to check if an event already exists with the reference URL. Right now, it returns a 404 error if it does, but it should return a 409 error instead.

The user should be notified if this happens that the event already exists.

Please write tests for this behavior.
