A previous conversation established the following behavior. Go ahead and continue to implement the plan in Notes/plan.md. The following is a summary of the behavior desired:

This is the next set of steps in revising the behavior of the timeline.

Features:

- Events should be shown on the timeline page for everyone, not just signed in users.
- Each event should be displayed next to its start date, with no end date shown on that line.
- Each event with an endTimestamp should be shown on the same line as its end date, with italicized "End of X" or "Death of X" for the description.
- The events should be vertically spaced evenly.
- If several events occur on a date, vertically space both date column with just one date shown, but the same number of lines as events. Then display the events next to the date. For example (where the date and event description are separated by a pipe):

  1772 | Event one starts
  | Event two starts
  | Event three happens
  1774 | Event two ends (italicized)
  1776 | Event one ends (italicized)
