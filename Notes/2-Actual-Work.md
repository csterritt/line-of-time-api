Right now, in the line-of-time-fe front end code, there are three stores. The user-info.ts one is fine,
but the event-store.ts and panel-store.ts ones could use some work.

Let's start with the event-store.ts one. It currently retrieves all the events or it retrieves events
in a specific range of dates. Let's switch that to only retrieving all the events, and making sure that
that only happens once when the app loads. From then on, the events will be filtered by the Lens/Timeline
components locally.

Next, the panel-store.ts one. This needs to be rewritten to support the new architecture.

The architecture for the Lens and Timeline components should work in the following way.

We will start out with a single Lens and Timeline. The first Lens is backed in the store by all the
events currently in the system. This first Lens is not shown. The Timeline looks to its parent Lens
for the set of events to display. The Timeline will have its own start and end dates, which will be
used to filter its display of the events in the parent Lens.

When the user adds a Lens and a Timeline, it has its own set of events whose names
are selected from events in the previous Timeline. So this Lens needs to know its parent Lens.
As events are selected by the user in a Lens, they should be added to the set of events for that
Lens. Then the Timeline for that Lens should update to show only the events that are in the set
of events for that Lens.
