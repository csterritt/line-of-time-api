First, refactor the 'initial-search.ts' file so that the 'POST' endpoint calls a new function named
'getWikipediaEvent' with the 'name' sent in from the request. It should have an option to call the
AI function 'aiCategorizationAndSearch' to categorize the event, which should be true for the 'POST'
endpoint.

Then, create a script named 'get-wikipedia-event.ts' in the 'scripts' directory.
The script should take a 'name' as an argument and call the 'getWikipediaEvent' function
with the AI option set to false. It should then print the result to the console.
