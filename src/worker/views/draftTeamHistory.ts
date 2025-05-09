import { bySport, PLAYER } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type {
	ViewInput,
	MinimalPlayerRatings,
	Player,
} from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { getDraftLotteryProbs } from "../../common/draftLottery.ts";
import { getNumToPick } from "../core/draft/genOrder.ts";
import { maxBy } from "../../common/utils.ts";

const updateDraftTeamHistory = async (
	inputs: ViewInput<"draftTeamHistory">,
) => {
	let filter;
	if (inputs.tid >= 0) {
		filter = (p: Player<MinimalPlayerRatings>) => p.draft.tid === inputs.tid;
	} else {
		filter = (p: Player<MinimalPlayerRatings>) =>
			p.draft.tid === g.get("userTid", p.draft.year + 1);
	}

	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ws"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});
	const playersAll2 = await idb.getCopies.players(
		{
			filter,
		},
		"noCopyCache",
	);
	const playersAll = await idb.getCopies.playersPlus(playersAll2, {
		attrs: [
			"tid",
			"abbrev",
			"draft",
			"pid",
			"firstName",
			"lastName",
			"age",
			"ageAtDeath",
			"hof",
			"watch",
			"jerseyNumber",
			"awards",
			"born",
		],
		ratings: ["ovr", "pot", "skills", "pos", "season"],
		stats,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});
	const players = [];
	for (const p of playersAll) {
		const currentPr = p.ratings.at(-1);
		const peakPr: any = maxBy(p.ratings, "ovr");

		let preLotteryRank: number | undefined;
		let lotteryChange: number | undefined;
		let lotteryProb: number | undefined;
		if (p.draft.round === 1) {
			const draftLottery = await idb.getCopy.draftLotteryResults(
				{
					season: p.draft.year,
				},
				"noCopyCache",
			);
			if (draftLottery) {
				const lotteryRowIndex = draftLottery.result.findIndex(
					(row) => row.pick === p.draft.pick,
				);
				if (lotteryRowIndex >= 0) {
					preLotteryRank = lotteryRowIndex + 1;
					lotteryChange = preLotteryRank - p.draft.pick;

					const numToPick = getNumToPick(
						draftLottery.draftType ?? "nba1994",
						draftLottery.result.length,
					);
					const { probs } = getDraftLotteryProbs(
						draftLottery.result,
						draftLottery.draftType,
						numToPick,
					);
					if (probs) {
						lotteryProb = probs[lotteryRowIndex]?.[p.draft.pick - 1];
					}
				}
			}
		}

		players.push({
			// Attributes
			pid: p.pid,
			firstName: p.firstName,
			lastName: p.lastName,
			draft: p.draft,
			currentAge: p.age,
			ageAtDeath: p.ageAtDeath,
			currentAbbrev: p.abbrev,
			currentTid: p.tid,
			hof: p.hof,
			watch: p.watch,
			jerseyNumber: p.jerseyNumber,
			awards: p.awards,

			// Ratings
			currentOvr: p.tid !== PLAYER.RETIRED ? currentPr.ovr : null,
			currentPot: p.tid !== PLAYER.RETIRED ? currentPr.pot : null,
			currentSkills: p.tid !== PLAYER.RETIRED ? currentPr.skills : [],
			pos: currentPr.pos,

			peakAge: peakPr.season - p.born.year,
			peakOvr: peakPr.ovr,
			peakPot: peakPr.pot,
			peakSkills: peakPr.skills,

			// Stats
			careerStats: p.careerStats,

			// Draft lottery
			preLotteryRank,
			lotteryChange,
			lotteryProb,
		});
	}

	const userAbbrev = g.get("teamInfoCache")[g.get("userTid")]?.abbrev;

	return {
		abbrev: inputs.abbrev,
		challengeNoRatings: g.get("challengeNoRatings"),
		draftType: g.get("draftType"),
		players: addFirstNameShort(players),
		stats,
		tid: inputs.tid,
		userAbbrev,
	};
};

export default updateDraftTeamHistory;
