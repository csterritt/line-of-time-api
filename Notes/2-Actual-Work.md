The NewEventView.vue file contains the form for creating a new event.
Currently, the categorizationType is just set to be whatever the categorization process
found. This is not ideal, as the user should be able to change the categorization type.
Please make it a simple drop-down list of the following categorization types:

- person
- one-time-event
- bounded-event
- other

The one exception is that if the categorization process finds either a redirect or a disambiguation,
then the categorization type should be set to other, and the user should not be able to change it.
