// main.ts 中的所有 interface 声明被移动到此文件

// 单个获取源设置项
export interface FetchSourceSetting {
	name: string;
	url: string;
	appID: string;
	appSecret: string;
	path: string;
	id?: string;
	willExport: boolean;
}

// 插件整体设置
export interface ObDBFetcherSettings {
	fetchSources: FetchSourceSetting[];
}

export interface FeishuIds {
	baseId: string;
	tableId: string;
	viewId: string;
}

export interface RecordFields {
	[key: string]: any;
	Title?: string;
	MD?: string;
	SubFolder?: string;
	UpdatedIn?: number;
}

export interface Record {
	fields: RecordFields;
}

export interface DateFilterOption {
	id: string;
	name: string;
	value: number;
}
