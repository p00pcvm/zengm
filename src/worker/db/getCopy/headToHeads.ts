import { idb } from "../index.ts";
import type { GetCopyType, HeadToHead } from "../../../common/types.ts";

const getCopy = async (
	{
		season,
	}: {
		season: number;
	},
	type?: GetCopyType,
): Promise<HeadToHead | undefined> => {
	const result = await idb.getCopies.headToHeads(
		{
			season,
		},
		type,
	);
	return result[0];
};

export default getCopy;
