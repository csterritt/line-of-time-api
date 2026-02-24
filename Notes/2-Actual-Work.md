Change the function 'aiCategorizationAndSearch' in the file 'ai-search.ts' to do a POST
to 'https://bap.cls.cloud/pipe' with the following JSON:

{
connectionSecret: c.env.BENT_AI_CONNECTION_SECRET,
content: rawText
}

Please for now just print the response to the console.
