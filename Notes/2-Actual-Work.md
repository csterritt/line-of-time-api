Please change the implementation of the panel-store.ts file to work in the following way.

1. There should be a 'nameList' variable in each LensStore that is an array of strings.
2. The 'nameList' should be built from the parent lens's events.
3. The 'nameList' should be updated when the parent lens's events are updated.
4. The 'events' should start out empty for all LensStores past the first.
5. The 'events' should be updated when the user adds an event to the lens.
6. The 'events' should be updated when the user removes an event from the lens.
7. The 'nameList' should be used instead of the computed 'availableEvents' in the
    LensDisplay.vue file.
