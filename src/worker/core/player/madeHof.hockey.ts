import { g, helpers } from "../../util/index.ts";
import type {
	Player,
	PlayerWithoutKey,
	MinimalPlayerRatings,
} from "../../../common/types.ts";

const madeHof = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): boolean => {
	let earliestSeason = Infinity;

	// Same as MVP formula
	let score = 0;
	let scoreFirstSeason;
	for (const ps of p.stats) {
		const g = ps.evG + ps.ppG + ps.shG;
		const a = ps.evA + ps.ppA + ps.shA;
		score += (g + a) / 25 + ps.ops + ps.dps + 0.775 * ps.gps;
		if (scoreFirstSeason === undefined) {
			scoreFirstSeason = score;
		}

		if (ps.season < earliestSeason) {
			earliestSeason = ps.season;
		}
	}

	if (scoreFirstSeason === undefined) {
		return false;
	}

	// Fudge factor for players generated when the league started
	const fudgeSeasons =
		Math.min(earliestSeason, g.get("startingSeason")) - p.draft.year - 5;

	if (fudgeSeasons > 0) {
		score += scoreFirstSeason * fudgeSeasons;
	}

	// Final formula
	return (
		score > 100 * helpers.gameAndSeasonLengthScaleFactor() * g.get("hofFactor")
	);
};

export default madeHof;
