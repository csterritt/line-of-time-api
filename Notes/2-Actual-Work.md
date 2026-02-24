I have changed the schema.ts file to rename the event table column 'referenceUrls' to 'referenceUrl',
and make it a string instead of an array of strings, and make it unique and not nullable.

Please follow the plan in plan.md to update all the code that references this column to use the new column name and type.
