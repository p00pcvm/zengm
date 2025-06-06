import { idb } from "../../db/index.ts";
import { getUpcoming } from "../../views/schedule.ts";
import { g, toUI } from "../../util/index.ts";
import type {
	LocalStateUI,
	ScheduleGame,
	ScheduleGameWithoutKey,
} from "../../../common/types.ts";
import addDaysToSchedule from "./addDaysToSchedule.ts";
import { PHASE } from "../../../common/index.ts";
import { isFinals } from "./isFinals.ts";

const makePlayoffsKey = (game: ScheduleGameWithoutKey) =>
	JSON.stringify([game.homeTid, game.awayTid]);

/**
 * Save the schedule to the database, overwriting what's currently there.
 *
 * @param {Array} tids A list of lists, each containing the team IDs of the home and
        away teams, respectively, for every game in the season, respectively.
 * @return {Promise}
 */
const setSchedule = async (tids: [number, number][]) => {
	const playoffs = g.get("phase") === PHASE.PLAYOFFS;

	const oldPlayoffGames: Record<string, ScheduleGame> = {};
	if (playoffs) {
		// If live simming an individual playoff game, setSchedule gets called afterwards with the remaining games that day. But that means it forgets forceWin! So we need to keep track of old forceWin values. Same with gid, which messes with LeagueTopBar if it changes.
		const oldSchedule = await idb.cache.schedule.getAll();

		for (const game of oldSchedule) {
			const key = makePlayoffsKey(game);
			oldPlayoffGames[key] = game;
		}
	}

	await idb.cache.schedule.clear();

	const finals = playoffs && (await isFinals());

	const schedule = addDaysToSchedule(
		tids.map(([homeTid, awayTid]) => ({
			homeTid,
			awayTid,
		})),
		await idb.cache.games.getAll(),
	);
	for (const game of schedule) {
		if (playoffs) {
			const key = makePlayoffsKey(game);
			if (oldPlayoffGames[key]) {
				game.day = oldPlayoffGames[key].day;
				game.gid = oldPlayoffGames[key].gid;
				game.forceWin = oldPlayoffGames[key].forceWin;
			}

			// Track if game is a finals game or not, used along with neutralSite
			if (finals) {
				game.finals = true;
			}
		}

		await idb.cache.schedule.add(game);
	}

	// Add upcoming games
	const games: LocalStateUI["games"] = [];
	const userTid = g.get("userTid");
	const upcoming = await getUpcoming({ tid: userTid });
	for (const game of upcoming) {
		games.push({
			finals: game.finals,
			gid: game.gid,
			teams: [
				{
					ovr: game.teams[0].ovr,
					tid: game.teams[0].tid,
					playoffs: game.teams[0].playoffs,
				},
				{
					ovr: game.teams[1].ovr,
					tid: game.teams[1].tid,
					playoffs: game.teams[1].playoffs,
				},
			],
		});
	}

	await toUI("mergeGames", [games]);
};

export default setSchedule;
