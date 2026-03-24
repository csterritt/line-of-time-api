There are several places throughout the tests where timestamps are represented as
strings of the form "YYYY-MM-DD", where the "YYYY" part may be 2, 3, or 4 digits.
Change all of them to have the literal string "-AD" added to the end.

For example, "1732-02-14" becomes "1732-02-14-AD", or "25-12-25" becomes "25-12-25-AD".
