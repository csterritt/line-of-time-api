The TimelineDisplay.vue file has gotten pretty large and messy. Let's refactor it to make it
more maintainable. I think a lot of the logic in the <script> section could be moved into one
of the existing stores, or potentially a new store if needed. Also the UI elements could be
broken out into separate components.
