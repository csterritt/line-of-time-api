First, rewrite the user-info.spec.ts file to be a bun test, using the timestamp.test.ts file as an example. Write any new non-end-to-end tests as bun tests.

Next, the panel-store.ts file needs to be rewritten to support the following architecture.

The store implements a Pinia store. It contains two structure types, a LensStore and a TimelineStore.
It also contains a list of structures, each of which is either a LensStore or a TimelineStore.

1. A LensStore contains a list of events.
   a. It knows its index into the list of structures.
   b. It knows its parent LensStore.
   c. It also knows its child TimelineStore.
   d. It maintains a Map of event names to event objects built from its parent LensStore's events.
   e. It has a method to add an event to its list of events.
   f. It has a method to remove an event from its list of events.
2. A TimelineStore contains a start and end date.
   a. It knows its index into the list of structures.
   b. It knows its parent LensStore.
3. On creation of the store, the first LensStore is created and added to the list of structures, and then the first TimelineStore is created and added to the list of structures.
4. The first LensStore has a null parent and the first TimelineStore as its child.
5. The first LensStore's list of events is all the events in the system.
6. Each TimelineDisplay displays its parent LensStore's events filtered by its start and end dates.
7. The first LensStore has no corresponding LensDisplay.
8. The first TimelineStore does have a corresponding TimelineDisplay.
9. When the user clicks the "Add lens panel" action:
   a. A new LensStore is created and added to the list of structures.
   b. A new TimelineStore is created and added to the list of structures.
   c. The new LensStore has the previous LensStore as its parent and the new TimelineStore as its child.
   d. The new LensStore's list of events is empty.
   e. The new TimelineStore has the new LensStore as its parent.
   f. The new TimelineStore's start and end dates are set to the current date.
   g. A new LensDisplay is created and given the new LensStore.
   h. A new TimelineDisplay is created and given the new TimelineStore.
10. The user can select events by name in a LensStore.
    a. The list of names come from the keys of the Map of event names to event objects.
    b. When an event name is selected, the corresponding event object from the Map is added to the LensStore's list of events.
    c. When an event is unselected, its object is removed from the LensStore's list of events.
    d. The TimelineDisplay for the LensStore's child TimelineStore is updated to show only the events that are in the LensStore's list of events.
11. The user can change the start and end dates in a TimelineDisplay.
    a. The start and end dates are updated in the TimelineStore.
    b. The TimelineDisplay is updated to show only the events that are in the LensStore's list of events based on those timestamps.
