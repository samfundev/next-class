import { error, json, type RequestHandler } from '@sveltejs/kit';
import ICalParser from 'ical-js-parser';

export const POST: RequestHandler = async ({ request }) => {
	const url: string = await request.json();
	if (!url.startsWith('https://myhu.harrisburgu.edu/ICS/api/ical/')) {
		throw error(400);
	}

	const response = await fetch(url);
	const data = await response.text();
	// wtf is vite doing
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const toJSON = ICalParser.toJSON ?? ICalParser.default.toJSON;
	const calendar = toJSON(data);

	return json(calendar.events.map(eventToClass));
};

function eventToClass(event: EventJSON) {
	const nameMatch = event.summary?.match(/\((.+)\)/);
	if (nameMatch == null) return null;

	const roomMatch = event.location?.match(/(\d{4})$/);

	return {
		start: parseDate(event.dtstart.value),
		end: parseDate(event.dtend.value),
		name: nameMatch[1],
		location: roomMatch == null ? 'virtual room' : `room ${roomMatch[1]}`
	};
}

function parseDate(value: string): string | null {
	const match = value.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/);
	if (match == null) return null;

	return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`;
}

// Roughly copied from ical-js-parser
interface EventJSON {
	begin: string;
	end: string;
	dtstart: DateTimeObject;
	dtend: DateTimeObject;
	dtstamp?: DateTimeObject;
	uid?: string;
	created?: DateTimeObject;
	description?: string;
	lastModified?: DateTimeObject;
	location?: string;
	sequence?: string;
	summary?: string;
	transp?: string;
	rrule?: string;
	status?: string;
	recurrenceId?: DateTimeObject;
	exdate?: DateTimeObject[];
}

export interface DateTimeObject {
	value: string;
	timezone?: string;
	isAllDay?: boolean;
}
