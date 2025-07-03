import { FuzzySuggestModal, FuzzyMatch } from "obsidian";
import { DateFilterOption } from "./types";
import { t } from "./lang/helpers";

export class DateFilterSuggester extends FuzzySuggestModal<DateFilterOption> {
	private options: DateFilterOption[] = [
		{ id: "day", name: `1. ${t("Notes updated today")}`, value: 1 },
		{
			id: "threeDays",
			name: `2. ${t("Notes updated in the pas 3 days")}`,
			value: 3,
		},
		{
			id: "week",
			name: `3. ${t("Notes updated in the past week")}`,
			value: 7,
		},
		{
			id: "twoWeeks",
			name: `4. ${t("Notes updated in the past two weeks")}`,
			value: 14,
		},
		{
			id: "month",
			name: `5. ${t("Notes updated in the past month")}`,
			value: 30,
		},
		{ id: "all", name: `6. ${t("All notes")}`, value: 9999 },
	];

	getItems(): DateFilterOption[] {
		return this.options;
	}

	getItemText(item: DateFilterOption): string {
		return item.name;
	}

	onChooseItem(
		item: DateFilterOption,
		_evt: MouseEvent | KeyboardEvent
	): DateFilterOption {
		return item;
	}

	renderSuggestion(
		item: FuzzyMatch<DateFilterOption>,
		el: HTMLElement
	): void {
		el.createEl("div", { text: item.item.name, cls: "suggester-title" });
	}
}
