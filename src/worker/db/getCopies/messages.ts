import { getAll, idb } from "../index.ts";
import { maybeDeepCopy, mergeByPk } from "./helpers.ts";
import type { GetCopyType, Message } from "../../../common/types.ts";

const getLastEntries = <T>(arr: T[], limit: number): T[] => {
	return arr.slice(arr.length - limit);
};

const getCopies = async (
	{
		limit,
		mid,
	}: {
		limit?: number;
		mid?: number;
	} = {},
	type?: GetCopyType,
): Promise<Message[]> => {
	if (mid !== undefined) {
		const message = await idb.cache.messages.get(mid);
		if (message) {
			return [maybeDeepCopy(message, type)];
		}

		const message2 = await idb.league.get("messages", mid);
		if (message2) {
			return [message2];
		}

		return [];
	}

	if (limit !== undefined) {
		const fromDb: Message[] = [];
		for await (const { value: message } of idb.league
			.transaction("messages")
			.store.iterate(undefined, "prev")) {
			fromDb.unshift(message);
			if (fromDb.length >= limit) {
				break;
			}
		}

		const fromCache = await idb.cache.messages.getAll();

		const messages = mergeByPk(
			fromDb,
			getLastEntries(fromCache, limit),
			"messages",
			type,
		);

		// Need another getLastEntries because DB and cache will probably combine for (2 * limit) entries
		return getLastEntries(messages, limit);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("messages").store),
		await idb.cache.messages.getAll(),
		"messages",
		type,
	);
};

export default getCopies;
