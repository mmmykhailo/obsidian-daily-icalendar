import { Plugin, request } from "obsidian";
import { readFromCache, writeToCache } from "./utils/cache";
import { filterMatchingEvents, parseIcs } from "utils/ics";
import { buildError, buildListOrPlaceholder, buildSkeleton } from "utils/html";

export default class IcalendarPlugin extends Plugin {
	async onload() {
		this.registerMarkdownCodeBlockProcessor(
			"icalendarList",
			(source, el) => {
				const [targetDateString, ...urls] = source
					.split("\n")
					.filter((row) => row.length > 0);

				const targetDateNum = Date.parse(targetDateString);

				if (isNaN(targetDateNum)) {
					el.replaceChildren(buildError());
					return;
				}

				const cached = readFromCache(targetDateString);

				if (cached === null) {
					el.replaceChildren(buildSkeleton());
				} else {
					const list = buildListOrPlaceholder(cached);
					el.replaceChildren(list);
				}

				Promise.all(urls.map(async (url) => await request(url))).then(
					(data) => {
						const events = data
							.map((response) => parseIcs(response))
							.flat();

						const filteredEvents = filterMatchingEvents(
							events,
							targetDateString
						).sort((a, b) => a.start.getTime() - b.start.getTime());

						writeToCache(targetDateString, filteredEvents);

						const list = buildListOrPlaceholder(filteredEvents);
						el.replaceChildren(list);
					}
				);
			}
		);
	}

	onunload() {}
}
