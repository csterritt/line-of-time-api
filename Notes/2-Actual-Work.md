Change the connector lines in TimelineDisplay.vue to be four units wide instead of two.
Change the width of the separator column to be 24 units instead of 20.

Also, as you go down the events, as a new event shows up it will get assigned to one of the
vertical lanes. Keep track of which event lanes are in use on each event's separator column,
and as new ones are added, give them a lane to live in. When all the lanes are full, there can be
overlap. Once an event ends, its lane will open up, so the next event can use it.
