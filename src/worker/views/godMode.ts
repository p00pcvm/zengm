import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";

const updateGodMode = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			godMode: g.get("godMode"),
		};
	}
};

export default updateGodMode;
