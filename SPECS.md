# line-of-time project

### Events

An event contains the following things:

- A start date
- An optional end date, for things such as wars that have a start/end date. Things that happen once, e.g., first human on moon, have only a start date
- A name
- A basic description
- An optional longer description
- A list of URLs to relevant reference material (e.g., wikipedia)
- A possibly empty list of related events

## basic timeline view

- There is a start page with one or more events.
- It has a start and an end date, that start out with (say) 40,000 BC and end with today's date.
- the start and end date are just type-in fields, and when modified change the global timeframe
- The events that fall within the global timeframe, inclusive, are shown in date order from earliest date at the top to latest date at the bottom.
- An event is shown with its "summarized start date", the name, a hyphen, and the basic description, all on one line.
- There is a vertical line on the left of the screen. it has a circle on it for each event, and each event lines up with that circle.
- Clicking an event on the timeline should open up an expanded view, to the right of the timeline, containing the basic description, the longer description if there, and the links.
- The initial layout will be that the event name and descriptions can fill the full width of the page, but are styled with the Tailwind 'truncate' so that anything beyond the width will be truncated, with an ellipsis to indicate that there is more text.
- When an event is opened in the expanded view, that takes up the right 2/3rds of the screen, with a vertical bar on its left. This should be 'above' the timeline text, so that timeline entries covered by it do not show.
- There will be an 'X' round button in the top right of the expanded view that closes that expanded view.
- Clicking another timeline event should close the current expanded view, and then open the expanded view for the clicked event.
- For signed in users, there will be an "Add a new event" button at the top of the page, and "Edit this event" buttons at the top of the expanded view of the event.

## date summarization

A event's start time will be shown in the basic timeline view with a summarized date. The idea is to make the date "appropriate" for the range of the timeline. So, for instance, if the current range of the timeline is one to three centuries, then just the year should be shown. If the timeline shows more than three centuries, then just the century of the event should be shown. For more than ten centuries, just the century should be shown. Within a year, the month should also be shown, and within four months the day should be shown as well.

## event CRUD

- When a signed in user clicks the "Add a new event" button, they're taken to a screen that lets them enter the information about an event.
- The following fields are required:
    - The start date
    - The name
    - The basic description
    - One URL to relevant reference information
- The following fields are optional:
    - The longer description
    - Other reference URLs
        - there should be one empty one below the first, and once that's filled in and 'Enter' pressed, another new empty line should show up
    - A list of related events
        - This should be a place-holder for now
