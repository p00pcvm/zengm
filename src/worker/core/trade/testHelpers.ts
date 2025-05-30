import { g } from "../../util/index.ts";
import testHelpers from "../../../test/helpers.ts";
import { player, trade } from "../index.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";

const beforeTests = async () => {
	testHelpers.resetG();

	g.setWithoutSavingToDB("numTeams", 3);
	g.setWithoutSavingToDB("numActiveTeams", 3);

	await testHelpers.resetCache({
		players: [
			// Two players per team
			player.generate(0, 30, 2017, true, DEFAULT_LEVEL),
			player.generate(0, 30, 2017, true, DEFAULT_LEVEL),
			player.generate(1, 30, 2017, true, DEFAULT_LEVEL),
			player.generate(1, 30, 2017, true, DEFAULT_LEVEL),
			player.generate(2, 30, 2017, true, DEFAULT_LEVEL),
			player.generate(2, 30, 2017, true, DEFAULT_LEVEL),
		],

		trade: [
			{
				rid: 0,
				teams: [
					{
						tid: 0,
						pids: [],
						pidsExcluded: [],
						dpids: [],
						dpidsExcluded: [],
					},
					{
						tid: 1,
						pids: [],
						pidsExcluded: [],
						dpids: [],
						dpidsExcluded: [],
					},
				],
			},
		],
	});
};

const reset = async () => {
	// Set to a trade with team 1 and no players;
	await trade.create([
		{
			tid: g.get("userTid"),
			pids: [],
			dpids: [],
			pidsExcluded: [],
			dpidsExcluded: [],
		},
		{ tid: 1, pids: [], dpids: [], pidsExcluded: [], dpidsExcluded: [] },
	]);
	await trade.clear();
};

export { beforeTests, reset };
