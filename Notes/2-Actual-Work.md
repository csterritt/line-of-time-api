Refactor the script 'get-wikipedia-event.ts' in the 'scripts' directory.
It should take two arguments: the first is a directory path, and the second is the name to
search for. The script should do the search of the name in wikipedia as it does now, and then
create a filename by concatenating the space-separated parts of the name, using
hyphens between words, and write the output of the 'getWikipediaEvent' function to a file
in the given directory with the concatenated name as the filename.
