import { App, Vault, Notice, normalizePath, requestUrl } from "obsidian";
import { FetchSourceSetting, FeishuIds, RecordFields, Record } from "./types";
import { t } from "../lang/helpers";
import { DateFilterOption } from "./types";
import { DateFilterSuggester } from "./suggesters";

class FeishuFetcher {
	private appID: string;
	private appSecret: string;
	apiUrlRoot: string;
	dataBaseIDs: FeishuIds;
	apiToken: string;
	app: App;
	vault: Vault;

	constructor(private readonly fetchSource: FetchSourceSetting, app: App) {
		this.appID = fetchSource.appID;
		this.appSecret = fetchSource.appSecret;
		this.app = app;
		this.vault = app.vault;
		this.dataBaseIDs = this.extractFeishuIds(fetchSource.url);
		this.apiUrlRoot = `https://open.feishu.cn/open-apis/bitable/v1/`;
	}

	extractFeishuIds(url: string): FeishuIds {
		try {
			const urlObj = new URL(url);

			return {
				baseId: urlObj.pathname.split("/").pop() || "",
				tableId: new URLSearchParams(urlObj.search).get("table") || "",
				viewId: new URLSearchParams(urlObj.search).get("view") || "",
			};
		} catch (error) {
			console.error("URL解析错误:", error);
			return { baseId: "", tableId: "", viewId: "" };
		}
	}

	makeApiUrl(feishuIds: FeishuIds): string {
		return `${this.apiUrlRoot}apps/${feishuIds.baseId}/tables/${feishuIds.tableId}/records/search`;
	}

	async setNewApiToken() {
		this.apiToken = await this.getNewApiToken();
	}

	async getNewApiToken() {
		const data = {
			app_id: this.appID,
			app_secret: this.appSecret,
		};
		const url =
			"https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal/";

		try {
			const res = await requestUrl({
				url: url,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			return res.json.app_access_token;
		} catch (error) {
			console.error(error.message);
		}
	}

	async fetchData() {
		let dateFilterOption: DateFilterOption | null = null;
		const suggester = new DateFilterSuggester(this.app);
		dateFilterOption = await new Promise<DateFilterOption>((resolve) => {
			suggester.onChooseItem = (item) => {
				resolve(item);
				return item;
			};
			suggester.open();
		});
		let url = this.makeApiUrl(this.dataBaseIDs);

		const request = {
			view_id: this.dataBaseIDs.viewId,
			field_names: ["Title", "MD", "SubFolder"],
			filter: {
				conditions: [
					{
						field_name: "UpdatedIn",
						operator: "isLessEqual",
						value: [dateFilterOption.value.toString()],
					},
				],
				conjunction: "and",
			},
		};

		let records = await this.getAllRecordsFromTable(url, request);
		console.dir(records);
		return records;
	}

	async createOrUpdateNotesInOBFromSourceTable(
		fetchSource: FetchSourceSetting
	): Promise<void> {
		const directoryRootPath = fetchSource.path;

		let notesToCreateOrUpdate: RecordFields[] = (
			await this.fetchData()
		).map((note: Record) => note.fields);

		new Notice(
			t("There are {{count}} files needed to be updated or created.", {
				count: notesToCreateOrUpdate.length.toString(),
			})
		);

		let configDirModified = 0;

		while (notesToCreateOrUpdate.length > 0) {
			let toDealNotes = notesToCreateOrUpdate.slice(0, 10);
			for (let note of toDealNotes) {
				let validFileName = this.convertToValidFileName(
					note.Title || ""
				);
				let folderPath =
					directoryRootPath +
					(note.SubFolder ? `/${note.SubFolder}` : "");
				await this.createPathIfNeeded(folderPath);
				const noteExtension =
					"Extension" in note ? note.Extension : "md";
				const notePath = `${folderPath}/${validFileName}.${noteExtension}`;
				const noteExists = await this.vault.adapter.exists(notePath);
				let noteContent = note.MD ? note.MD : "";
				if (!noteExists) {
					await this.vault.create(notePath, noteContent);
				} else if (noteExists && notePath.startsWith(".")) {
					await this.vault.adapter
						.write(notePath, noteContent)
						.catch((r: any) => {
							new Notice(
								t("Failed to write file: {{error}}", {
									error: r,
								})
							);
						});
					configDirModified++;
				} else {
					let file = this.app.vault.getFileByPath(notePath);
					if (file) {
						await this.vault.modify(file, noteContent);
						await new Promise((r) => setTimeout(r, 100)); // 等待元数据更新
					}
				}
			}

			notesToCreateOrUpdate = notesToCreateOrUpdate.slice(10);
			if (notesToCreateOrUpdate.length) {
				new Notice(
					t("There are {{count}} files needed to be processed.", {
						count: notesToCreateOrUpdate.length.toString(),
					})
				);
			} else {
				new Notice(t("All Finished."));
			}
		}
	}

	convertToValidFileName(fileName: string): string {
		return fileName.replace(/[\/|\\:'"()（）{}<>\.\*]/g, "-").trim();
	}

	async createPathIfNeeded(folderPath: string): Promise<void> {
		const directoryExists = await this.vault.adapter.exists(folderPath);
		if (!directoryExists) {
			await this.vault.createFolder(normalizePath(folderPath));
		}
	}

	async getAllRecordsFromTable(url: string, request: any): Promise<any[]> {
		let records: any[] = [];
		let hasMore = false;
		await this.setNewApiToken();

		do {
			try {
				let queryUrl = url;
				const requestConfig = {
					url: queryUrl,
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + this.apiToken,
					},
					body: JSON.stringify(request),
				};
				const response = await requestUrl(requestConfig);

				if (response.json.error) {
					new Notice(response.json.error.message);
				} else {
					const data = response.json;
					records = records.concat(data.data.items);

					hasMore = data.data.has_more || false;
				}
			} catch (error) {
				new Notice(error.message);
				hasMore = false;
			}
		} while (hasMore);

		return this.reformatRecords(records);
	}

	reformatRecords(records: any[]): any[] {
		if (!Array.isArray(records) || records.length === 0) {
			return [];
		}
		for (let index = 0; index < records.length; index++) {
			const fields = records[index]?.fields;
			if (!fields) continue;
			for (const [key, value] of Object.entries(fields)) {
				// 处理 value 是数组且第一个元素是对象且 type 为 "text"
				if (
					Array.isArray(value) &&
					value.length > 0 &&
					typeof value[0] === "object" &&
					value[0] !== null &&
					"text" === (value[0] as any).type
				) {
					records[index].fields[key] = (value[0] as any).text;
				}
				// 处理 value 是对象且 type 为 1，且 value.value 是数组
				else if (
					value !== null &&
					typeof value === "object" &&
					"value" in value &&
					"type" in value &&
					(value as any).type === 1 &&
					Array.isArray((value as any).value) &&
					(value as any).value.length > 0 &&
					typeof (value as any).value[0] === "object" &&
					(value as any).value[0] !== null &&
					"text" in (value as any).value[0]
				) {
					records[index].fields[key] = (value as any).value[0].text;
				} else {
					records[index].fields[key] = value;
				}
			}
		}
		return records;
	}
}

export default FeishuFetcher;
