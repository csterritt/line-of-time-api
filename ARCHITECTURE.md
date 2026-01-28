## Architecture

This is a web application built with Hono, Tailwind CSS, DaisyUI, and Cloudflare D1 database, accessed via the Drizzle ORM. It will be deployed as a Cloudflare Worker.

It is based above the [daisy-tw-worker-d1-drizzle](https://github.com/csterritt/daisy-tw-worker-d1-drizzle) template.

### Overview

The application will consist of a back end and a front end.

The back end will be a Cloudflare Worker, built with Hono and Cloudflare D1 database, accessed via the Drizzle ORM.

The front end will be a web page, built with Vue 3, Pinia, Tailwind CSS, and DaisyUI.

The two will communicate via an API, which will send and receive JSON.

### The API

The API will be a REST API. There will be the following endpoints, initially:

- GET /api/events
- GET /api/events/:id
- POST /api/events/:id
- PUT /api/events/:id
- DELETE /api/events/:id

The GET events can be retrieved by any user. The POST, PUT, and DELETE events can only be retrieved by a signed-in user. The daisy-tw-worker-d1-drizzle template provides user authentication via the [better-auth](https://www.better-auth.com) library.

These endpoints will take JSON as input, and return JSON as output. Success will be indicated by a 200 status code, and failure will be indicated by a 400 status code.

### The UI

The UI will be a single page application, with the following views:

#### The timeline view
- The start page, which shows a list of events in the global timeframe.
- The expanded view of an event, which shows the event's details.
- Both the start page and the expanded view of an event will be contained within a "column". The timeline view will be the leftmost column, and the expanded view will appear and disappear as needed.

#### The column
- The column will have a vertical line on the left, with a circle for each event, and each event will be aligned with its circle.
- When the user clicks on an event, the expanded view will be shown, in a new column to the right of the timeline column.
- The expanded view will have an "X" button (with a tooltip that says "Back to timeline") that closes that column.
- Each column to the right of another column will be "in front" of the column to its left, that is, its content will cover the content of the column to its left.

#### The event management views
- The add event page, which allows a signed-in user to add a new event.
- The edit event page, which allows a signed-in user to edit an existing event.
