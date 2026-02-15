For this task, I want not only a plan, but a list of tasks in the order I should do them.
The main '/ui/' page shows the timeline.
There should be a pair of controls at the top, giving the minimum and maximum timestamps to display on the timeline. The control should start with the current min and max timestamps of the timeline. You should be able to choose the min and max timestamps, and the timeline should update to show only the events that fall within the chosen range.
There should be a simple date (without time) picker for each control. Additionally, there should be a "reset" button for each control, which will reset the control to the current min and max timestamps of the timeline.
Currently, each event shows the start and optional end timestamps. Change the display to show only the start year of the event, when the min and max timestamps are more than 1 year apart. When the min and max timestamps are less than 1 year apart, show the start year and month of the event.
