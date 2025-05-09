import { idb } from "../db/index.ts";
import { g, local, updatePlayMenu } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { bySport, SIMPLE_AWARDS } from "../../common/index.ts";

const viewedSeasonSummary = async () => {
	local.unviewedSeasonSummary = false;
	await updatePlayMenu();
};

const updateHistory = async (
	{ season }: ViewInput<"history">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (local.unviewedSeasonSummary) {
		viewedSeasonSummary();
	}

	if (updateEvents.includes("firstRun") || state.season !== season) {
		const awards = await idb.getCopy.awards({
			season,
		});

		if (!awards) {
			viewedSeasonSummary(); // Should never happen, but just in case

			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				invalidSeason: true as const,
				season,
			};
			return returnValue;
		}

		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: ["playoffRoundsWon", "abbrev", "region", "name"],
				season,
			},
			"noCopyCache",
		);

		const addAbbrev = (obj: any) => {
			// Not sure why this would ever be null, but somebody said it was
			if (obj == undefined) {
				return;
			}

			const t = teams.find((t) => t.tid === obj.tid);
			if (t) {
				obj.abbrev = t.seasonAttrs.abbrev;
			} else {
				obj.abbrev = "???";
			}
		};

		for (const key of SIMPLE_AWARDS) {
			addAbbrev(awards[key]);
		}
		const possibleTeamAwards = ["allLeague", "allDefensive"];
		for (const key of possibleTeamAwards) {
			if (awards[key]) {
				for (const team of awards[key]) {
					for (const p of team.players) {
						addAbbrev(p);
					}
				}
			}
		}
		const flatTeams = bySport({
			baseball: ["allRookie", "allOffense", "allDefense"],
			basketball: ["allRookie", "sfmvp"],
			football: ["allRookie"],
			hockey: ["allRookie"],
		});
		for (const key of flatTeams) {
			if (awards[key]) {
				for (const p of awards[key]) {
					addAbbrev(p);
				}
			}
		}

		// Hack placeholder for old seasons
		if (!awards.allRookie) {
			awards.allRookie = [];
		}

		// For old league files, this format is obsolete now
		if (awards && awards.bre && awards.brw) {
			awards.bestRecordConfs = [awards.bre, awards.brw];
		}

		const retiredPlayersAll = await idb.getCopies.players(
			{
				retiredYear: season,
			},
			"noCopyCache",
		);
		const retiredPlayers = await idb.getCopies.playersPlus(retiredPlayersAll, {
			attrs: ["pid", "name", "age", "hof"],
			season,
			ratings: ["pos"],
			stats: ["tid", "abbrev"],
			showNoStats: true,
		});
		retiredPlayers.sort((a, b) => b.age - a.age);

		// Get champs
		const champ = teams.find(
			(t) =>
				t.seasonAttrs.playoffRoundsWon ===
				g.get("numGamesPlayoffSeries", season).length,
		);

		return {
			awards,
			champ,
			confs: g.get("confs", season),
			invalidSeason: false as const,
			retiredPlayers,
			season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHistory;
