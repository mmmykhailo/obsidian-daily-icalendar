# Obsidian Daily ICalendar plugin

This is a plugin for Obsidian (https://obsidian.md).

It offers a method for retrieving a list of events on a specified date. By taking in a date and a set of ICS links, it retrieves the corresponding calendars and displays the events in a list. The outcomes are stored in local storage for the given date, enabling quick access to them in subsequent requests.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Usage example
~~~markdown
```icalendarList
2023-11-16
https://calendar.google.com/calendar/ical/user%40gmail.com/basic.ics
https://calendar.google.com/calendar/ical/.../basic.ics
```
~~~
will return the events or a label telling that no events are planned.
![No events screenshot](screenshots/no-events.png)
![Events screenshot](screenshots/events.png)