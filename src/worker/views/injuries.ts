import { bySport, PHASE } from "../../common/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { getPlayers } from "./playerRatings.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";

const updateInjuries = async (
	inputs: ViewInput<"injuries">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		((inputs.season === g.get("season") || inputs.season === "current") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
		inputs.season !== state.season ||
		inputs.abbrev !== state.abbrev
	) {
		const stats = bySport({
			baseball: ["gp", "keyStats"],
			basketball: ["gp", "pts", "trb", "ast"],
			football: ["gp", "keyStats"],
			hockey: ["gp", "keyStats"],
		});

		const players = await getPlayers(
			inputs.season === "current" ? g.get("season") : inputs.season,
			inputs.abbrev,
			["injury", "injuries"],
			["ovr", "pot"],
			[...stats, "jerseyNumber"],
			inputs.tid,
		);

		const injuries = [];
		for (const p of players) {
			if (inputs.season === "current") {
				if (p.injury.gamesRemaining > 0) {
					const injury = p.injuries.at(-1);
					injuries.push({
						...p,
						type: p.injury.type,
						games: p.injury.gamesRemaining,
						ovrDrop: injury?.ovrDrop,
						potDrop: injury?.potDrop,
					});
				}
			} else {
				for (const injury of p.injuries) {
					if (injury.season === inputs.season) {
						injuries.push({
							...p,
							type: injury.type,
							games: injury.games,
							ovrDrop: injury.ovrDrop,
							potDrop: injury.potDrop,
						});
					}
				}
			}
		}

		const userTid = g.get("userTid");

		return {
			abbrev: inputs.abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			injuries: addFirstNameShort(injuries),
			season: inputs.season,
			stats,
			userTid,
		};
	}
};

export default updateInjuries;
