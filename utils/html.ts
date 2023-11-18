import { VCalendar, VEvent, VTimeZone } from "node-ical";
import { extractMeetingInfo, isVEvent } from "./ics";
import { moment } from "obsidian";

export const buildList = (events: (VTimeZone | VEvent | VCalendar)[]) => {
	const list = createEl("ul");
	for (const event of events) {
		if (isVEvent(event)) {
			const meetingInfo = extractMeetingInfo(event);
			const li = createEl("li");

			const time = moment(event.start).format("HH:mm");
			if (time !== "00:00") {
				li.appendText(time);
				li.appendText(" - ");
			}

			if (meetingInfo.callUrl) {
				li.appendChild(
					createEl("a", {
						cls: "external-link",
						text: event.summary,
						href: meetingInfo.callUrl,
					})
				);
			} else {
				li.appendChild(
					createSpan({
						text: event.summary,
					})
				);
			}

			list.appendChild(li);
		}
	}
	return list;
};

export const buildPlaceholder = () => {
	return createDiv({ cls: "cm-em", text: "No events today" });
};

export const buildListOrPlaceholder = (
	events: (VTimeZone | VEvent | VCalendar)[]
) => {
	if (events.length) {
		return buildList(events);
	}
	return buildPlaceholder();
};

export const buildSkeleton = () => {
	const list = createEl("ul");

	for (let i = 0; i < 3; i++) {
		const li = createEl("li");
		li.appendChild(createSpan({ cls: "icalendar-skeleton" }));
		list.appendChild(li);
	}

	return list;
};

export const buildError = () => {
	return createDiv({ text: "You should provide a valid date on first line" });
};
