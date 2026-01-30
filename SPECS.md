# line-of-time project

## Time in this project

We'd like to be able to represent events like the big bang, the start of the triassic period, etc., that are kind of a long time ago.

The big bang was approximately (rounding up) 14 billion years ago.

That's 5,311,005,000,000 (~ 5.3 trillion) days ago.

2 \*\* 52 = 4,503,599,627,370,496, or ~4.5 quadrillion.

That is still below JavaScript's MAX_INT (where x + 1 === x).

JS's MAX_INT is 9,007,199,254,740,991 or ~9 quadrillion.

Since we're not _exactly_ sure when the big bang was, 14 billion years ago is an upper bound.

In this project, days will be represented as a number, which we will call a "timestamp".

So timestamps will then, in our system, be the number of days since the birth of Christ, since we have a calendar system that can deal with that. Timestamps BC will be negative, timestamps AD positive.

The UI will have a per-user preference setting for whether to display "BC/AD" or "BCE/CE".

This system will be dealing with days as the smallest unit of measure. Two events that happened on the same day will probably be ordered by their title.

There will be fromTimestamp and toTimestamp functions.

- fromTimestamp will take a timestamp and return a string date, such as "40,000 BC", "January 1, 306 BC", "June 19, 2025 AD". It has a "precision" parameter to control the output level (year only, month+year, full date)
- toTimestamp will take a string date and return the timestamp for that day.

### Events

An event contains the following things:

- A start timestamp
- An optional end timestamp, for things such as wars that have a start/end timestamp. Things that happen once, e.g., first human on moon, have only a start timestamp
- A name
- A basic description
- An optional longer description
- A list of URLs to relevant reference material (e.g., wikipedia)
- A possibly empty list of related events

## basic timeline view

- There is a start page with one or more panels. The leftmost panel is the initial timeline panel.
- Each panel has a start and an end day, the first one to start out with (say) 40,000 BC and end with today's day.
- The start and end day are modifiable fields, and when changed, change the timeframe for that panel.
  - We'll have to come up with some clever way to enter days very far in the past.
  - Possibly just a year for dates before the "earliest" date we know of.
  - Possibly just a century, then a millenia, then 100k years for really early stuff?
- The events that fall within the panel's timeframe, inclusive, are shown in day order from earliest day at the top to latest day at the bottom.
- An event is shown with its "summarized start day", the name, a hyphen, and the basic description, all on one line.
- Clicking an event on the timeline should open up another panel, to the right of the timeline, containing the basic description, the longer description if there, and the links.
- The initial layout will be that the event name and descriptions fill the full width of the panel, but are styled with the Tailwind 'truncate' so that anything beyond the width will be truncated, with an ellipsis to indicate that there is more text. Tooltips will be used to show the full text.
- The new panel will be to the right of whatever panel was clicked.
- For desktop, the new panel will be the same size as the panel to its left.
- For mobile, the new panel will "on top" of the panel to its left.
- There will be an 'X' round button in the top right of the all panels past the first, that closes that panel.
- Clicking a timeline event in a panel should close any panels to its right, and then open a new panel to the right for the clicked event.
- For signed in users, there will be an "Add a new event" button at the top of the page, and "Edit this event" buttons at the top of the expanded view of the event.

## date summarization

A event's start time will be shown in the basic timeline view with a summarized date. The idea is to make the date "appropriate" for the range of the timeline. So, for instance, if the current range of the timeline is one to three centuries, then just the year should be shown. If the timeline shows more than three centuries, then just the century of the event should be shown. For more than ten centuries, just the century should be shown. Within a year, the month should also be shown, and within four months the day should be shown as well.

## event CRUD

- When a signed in user clicks the "Add a new event" button, they're taken to a screen that lets them enter the information about an event.
- The following fields are required:
  - The start timestamp
  - The name
  - The basic description
  - One URL to relevant reference information
- The following fields are optional:
  - The end timestamp
  - The longer description
  - Other reference URLs
    - there should be one empty one below the first, and once that's filled in and 'Enter' pressed, another new empty line should show up
  - A list of related events
    - This should be a place-holder for now

### The API

The API will be a REST API. There will be the following endpoints, initially:

- GET /time-info/events/:start/:end
- GET /time-info/event/:id
- POST /time-info/search
- POST /time-info/new-event
- PUT /time-info/event/:id
- DELETE /time-info/event/:id

The GET events and search can be done by any user. For the first, the :start and :end parameters are timestamps. The create POST, PUT, and DELETE events can only be done by a signed-in user. The daisy-tw-worker-d1-drizzle template provides user authentication via the [better-auth](https://www.better-auth.com) library.

These endpoints will take JSON as input, and return JSON as output. Success will be indicated by a 200 status code, and failure will be indicated by a 400 status code.
