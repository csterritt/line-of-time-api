We want to have a new store for the line-of-time-fe code, named panel-store.ts. This will be a Pinia store, and will be used to store the display state of the line-of-time-fe code, called the displayList.

One important idea is that a 'Panel' is a simple Typescript object of a specific type, and a 'Display' is a Vue component that will be used to display the panel.

So there will be a TimelinePanel and a TimelineDisplay, and a LensPanel and a LensDisplay.

For now, the displayList will only exist in memory, so no changes to the database or its schema should be necessary.

The TimelineDisplay.vue component already exists, but will need to be modified.

A TimelinePanel object has two values: a start timestamp and an end timestamp. They start out with the minimum and maximum possible values. They are sent by the TimelinePanel to the event-store to get the events that occurred between those timestamps. So the TimelineDisplay will use the events it gets from its TimelinePanel to display the timeline. This will simplify the HomeView.vue component, which will no longer need to know about the event-store.

A LensPanel object has a list of event names. It starts out empty.

The displayList starts out with a single TimelinePanel object.

The HomeView.vue component will use the displayList to display the panels. It will show them in a horizontally scrolling display, which should expand to the right as new panels are added.

The LensDisplay will show the list of event names, and at the end of the list, it will show a drop-down list of all the known event names. The user can select an event name from the drop-down list, and it will be added to the end of the list of event names. Next to each event name, there will be a button that will allow the user to remove the event name from the list. The drop-down will also allow the user to type in part of an event name, to speed finding events. However, they must choose one of the actual event names from the list.

The display store will have a list of panels. The first panel will be a TimelinePanel object.

The TimelineDisplay component will display the timeline as it does now, in a daisyui card. It will be two thirds of the width of the page. It will have a circular secondary button with a "+" in it to the right of the card, which will allow the user to add a new LensPanel to the display, which will be added to the end of the list of panels.

The LensDisplay component will display the list of event names it contains, in a daisyui card. It will be two thirds of the width of the page. It will have a circular secondary button with a "+" in it to the right of the card, which will allow the user to add a new TimelinePanel to the display list.
