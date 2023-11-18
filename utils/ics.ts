import {
	VCalendar,
	VEvent,
	VTimeZone,
	parseICS as icalParseIcs,
} from "node-ical";
import { tz } from "moment-timezone";
import { moment } from "obsidian";

type VGoogleCOnferenceEvent = VEvent & {
	"GOOGLE-CONFERENCE": string;
};

export function extractMeetingInfo(e: VEvent) {
	// Check for Google Meet conference data
	if (isVGoogleCOnferenceEvent(e)) {
		return { callUrl: e["GOOGLE-CONFERENCE"], callType: "Google Meet" };
	}
	// Check if the location contains a Zoom link
	if (typeof e.location === "string" && e.location.includes("zoom.us")) {
		return { callUrl: e.location, callType: "Zoom" };
	}
	if (typeof e.description === "string") {
		const skypeMatch = e.description.match(
			/https:\/\/join.skype.com\/[a-zA-Z0-9]+/
		);
		if (skypeMatch) {
			return { callUrl: skypeMatch[0], callType: "Skype" };
		}

		const teamsMatch = e.description.match(
			/(https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^>]+)/
		);
		if (teamsMatch) {
			return { callUrl: teamsMatch[0], callType: "Microsoft Teams" };
		}
	}
	return { callUrl: null, callType: null };
}

function adjustDateToOriginalTimezone(
	originalDate: Date,
	currentDate: Date,
	tzid: string
): Date {
	const momentOriginal = tz(originalDate, tzid);
	const momentCurrent = tz(currentDate, tzid);

	// Calculate the difference in hours and minutes between the original and current
	const hourOffset = momentOriginal.hour() - momentCurrent.hour();
	const minuteOffset = momentOriginal.minute() - momentCurrent.minute();

	// Adjust the current date by the offset to keep the local time constant
	return momentCurrent
		.add(hourOffset, "hours")
		.add(minuteOffset, "minutes")
		.toDate();
}

export function filterMatchingEvents(
	icsArray: any[],
	dayToMatch: string
): VEvent[] {
	return icsArray.reduce((matchingEvents, event) => {
		let hasRecurrenceOverride = false;
		if (event.recurrences !== undefined) {
			for (const date in event.recurrences) {
				if (moment(date).isSame(dayToMatch, "day")) {
					hasRecurrenceOverride = true;
				}

				const recurrence = event.recurrences[date];
				if (moment(recurrence.start).isSame(dayToMatch, "day")) {
					matchingEvents.push(recurrence);
				}
			}
		}
		if (typeof event.rrule !== "undefined" && !hasRecurrenceOverride) {
			event.rrule
				.between(
					moment(dayToMatch).startOf("day").toDate(),
					moment(dayToMatch).endOf("day").toDate()
				)
				.forEach((date: Date) => {
					// We need to clone the event and override the date

					const clonedEvent = { ...event };

					console.debug(
						"Found a recurring event to clone: ",
						event.summary,
						" on ",
						date,
						"at ",
						event.start.toString()
					);
					console.debug(
						"RRULE origOptions:",
						event.rrule.origOptions
					);

					// But timezones...
					if (
						event.rrule != undefined &&
						event.rrule.origOptions.tzid
					) {
						const tzid = event.rrule.origOptions.tzid;
						console.debug("Event rrule.origOptions.tzid:", tzid);
						// Adjust the cloned event start and end times to the original event timezone
						clonedEvent.start = adjustDateToOriginalTimezone(
							event.start,
							date,
							tzid
						);
						clonedEvent.end = adjustDateToOriginalTimezone(
							event.end,
							date,
							tzid
						);
					} else {
						// If there is no timezone information, assume the event time should not change
						clonedEvent.start = new Date(date);
						clonedEvent.end = new Date(
							date.getTime() +
								(event.end.getTime() - event.start.getTime())
						);
					}

					// Remove rrule property from clonedEvent
					delete clonedEvent.rrule;

					console.debug("Cloned event:", {
						...clonedEvent,
						start: clonedEvent.start.toString(),
						end: clonedEvent.end.toString(),
					});

					matchingEvents.push(clonedEvent);
				});
		} else if (!hasRecurrenceOverride) {
			if (moment(event.start).isSame(dayToMatch, "day")) {
				matchingEvents.push(event);
			}
		}
		return matchingEvents;
	}, []);
}

export function parseIcs(ics: string) {
	const data = icalParseIcs(ics);
	const vevents = [];

	for (const i in data) {
		if (data[i].type != "VEVENT") continue;
		vevents.push(data[i]);
	}
	return vevents;
}

export function isVEvent(obj: VTimeZone | VEvent | VCalendar): obj is VEvent {
	return typeof obj === "object" && obj !== null && obj.type === "VEVENT";
}
export function isVGoogleCOnferenceEvent(
	obj: VEvent
): obj is VGoogleCOnferenceEvent {
	return (
		typeof obj === "object" &&
		obj !== null &&
		!!(obj as VGoogleCOnferenceEvent)["GOOGLE-CONFERENCE"]
	);
}
