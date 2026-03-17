## Timestamp Format Change

The 'timestamp' format is changing from an integer with a proprietary format to a Julian day.

For this, I have installed the `julian` package to handle Julian day conversions. The documentation
for this is found at https://github.com/stevebest/julian

### Migration

There is no old data to migrate. There are, however, a number of files that dealt with timestamps:

- line-of-time-fe/src/utils/timestamp.ts
- src/lib/timestamp.ts
- tests/timestamp.test.ts

These will all need to be examined to see if they are still needed to handle the new timestamp format.
Notably, there were conversion functions between Year/Month/Day and the old timestamp format. These
will need to be rewritten to handle the new timestamp format.

### Validation

The new timestamp format should be validated to ensure that the year, month, and day are valid.
Notably, only the startYear is required. The startMonth and startDay are optional, but if given,
should be valid. The endYear, endMonth, and endDay are all optional, but if given, should be valid.
If a startMonth is not given, a startDay cannot be given. Similarly, if a endYear is not given,
then neither can a endMonth or endDay be given. If an endYear is given, and no endMonth, then an
endDay cannot be given. Finally, if an endYear is given, it must be greater than or equal to the
startYear. If the startYear and endYear are the same, then the endMonth must be greater than or equal to
the startMonth. If the startMonth and endMonth are the same, then the endDay must be greater than or
equal to the startDay.

The earliest date allowed is January 1, 4713 B.C.

When no startMonth is given, the startMonth and startDay should be taken to be 1. When a startMonth is
given but not a startDay, the startDay should be taken to be 1. When an endYear is given, but no
endMonth, the endMonth should be set to 12 and the endDay should be set to 31. When an endMonth is given,
but no endDay, the endDay should be set to the last day of the endMonth.

### Frontend

The frontend will need to be updated to handle the new timestamp format. Specifically, the components
that deal with the startTimestamp and endTimestamp fields will need to be updated to handle the new
timestamp format.
