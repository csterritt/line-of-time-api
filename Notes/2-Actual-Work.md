First of all, please remove any tests that show that the Timeline display grid is only visible when
a user is signed in. The only control that should only be visible when a user is signed in is the
"Add a new event" button. The rest of the Timeline and Lens display should be visible whether or
not a user is signed in.

Second, the behavior of the Lenses is wrong. The first lens should consider every event selected.
Assume that the first lens has events A, B, C, D, E, and F.
Then, if user uses the second lens to select events B, C, and D, and then creates a third lens,
the third lens should only show events B, C, and D. It should not show A, E, or F.

Finally, give a concise description of what the problem is for each test that is failing.
Write this to the file "Notes/Failed-Tests.md".
