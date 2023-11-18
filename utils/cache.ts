export const writeToCache = (key: string, data: unknown) => {
	return localStorage.setItem(`icalendar-${key}`, JSON.stringify(data));
};
export const readFromCache = (key: string) => {
	try {
		return (
			JSON.parse(localStorage.getItem(`icalendar-${key}`) || "") || null
		);
	} catch {
		return null;
	}
};
