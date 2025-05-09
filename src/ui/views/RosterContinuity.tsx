import { DataTable } from "../components/index.tsx";
import useTitleBar from "../hooks/useTitleBar.tsx";
import { getCols, gradientStyleFactory } from "../util/index.ts";
import type { Col } from "../components/DataTable/index.tsx";
import type { View } from "../../common/types.ts";
import { frivolitiesMenu } from "./Frivolities.tsx";
import { bySport } from "../../common/index.ts";

const gradientStyle = bySport({
	baseball: gradientStyleFactory(0.6, 0.75, 0.8, 0.95),
	basketball: gradientStyleFactory(0.5, 0.775, 0.85, 1),
	football: gradientStyleFactory(0.6, 0.75, 0.8, 0.95),
	hockey: gradientStyleFactory(0.55, 0.7, 0.775, 0.925),
});

const RosterContinuity = ({
	abbrevs,
	season,
	seasons,
	userAbbrev,
}: View<"rosterContinuity">) => {
	useTitleBar({
		title: "Roster Continuity",
		customMenu: frivolitiesMenu,
	});
	const cols = [
		...getCols(["Season"]),
		...abbrevs.map((abbrev): Col => {
			return {
				classNames: userAbbrev === abbrev ? "table-info" : undefined,
				sortSequence: ["desc", "asc"],
				sortType: "number",
				title: abbrev,
			};
		}),
	];
	const rows = seasons.map((seasonRow, i) => {
		return {
			key: season - i,
			data: [
				season - i,
				...seasonRow.map((pct) => {
					if (pct === undefined) {
						return null;
					}

					return {
						style: gradientStyle(pct),
						value: pct.toFixed(2),
					};
				}),
			],
		};
	});
	return (
		<>
			<p>
				Each cell in the table shows the percentage of minutes played that
				season by players who were on the same team the previous season.
			</p>

			<DataTable
				cols={cols}
				defaultSort={[0, "desc"]}
				name="RosterContinuity"
				pagination={rows.length > 100}
				rows={rows}
			/>
		</>
	);
};

export default RosterContinuity;
