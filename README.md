# Obsidian Feishu Fetcher

[简体中文](./README_zh-CN.md)

An Obsidian plugin that fetches data from Feishu Bitable and automatically creates or updates notes in your Obsidian vault.

## ✨ Features

-   **Multiple Data Sources**: Configure multiple Feishu Bitables as data sources.
-   **Flexible Note Creation**:
    -   Uses the `Title` field as the note title.
    -   Uses the content of the `MD` field as the note's body.
    -   Supports placing notes in specific subfolders using the `SubFolder` field.
    -   Supports customizing the file extension of notes via the `Extension` field (defaults to `.md`).
    -   Uses the `UpdatedIn` field content to provide date filtering when fetching notes.
-   **Incremental Updates**: Fetches data based on the last updated time of a record to avoid redundant processing.
-   **Simple Configuration UI**: Provides a graphical interface to manage all data sources, with support for importing and exporting configurations for easy migration.
-   **Command Palette Integration**: Automatically creates a fetch command for each data source for quick access.

---

## 🚀 Quick Start

The setup process is divided into two main parts: **Feishu Setup** and **Obsidian Setup**.

### (I) Feishu Setup

On the Feishu side, you need to create a custom application and a Bitable for synchronization.

#### 1. Create a Feishu Custom App

You need a custom app with permissions to read Bitables to fetch data.

1.  Visit the [Feishu Open Platform](https://open.feishu.cn/app) and log in.
2.  Click **Create App** and select **Enterprise Custom App**.
3.  Fill in the app name (e.g., "Obsidian Sync Helper") and description.
4.  On the **Permissions** page of your app, search for and enable the following permission:
    -   `bitable:app_table:readonly`: Read records from the Bitable.
5.  On the **Versions & Release** page, create a new version and **publish** your application.
6.  Return to the **Credentials & Basic Info** page to get your **App ID** and **App Secret**. These are required for configuring the plugin.

#### 2. Create and Configure the Feishu Bitable

This will be your data source. You need to create a table and set up the necessary fields.

1.  Create a new [Feishu Bitable](https://feishu.cn/base).
2.  **[IMPORTANT]** Create the following fields in your table (**field names must match exactly**):
    -   `Title` (Type: `Text`): The title of the note.
    -   `MD` (Type: `Text`): The main content of the note, supporting Markdown format.
    -   `SubFolder` (Type: `Text`, Optional): The subfolder path for the note. For example, `Journal/2025` will save the note to `[Your Target Path]/Journal/2025`.
    -   `Extension` (Type: `Text`, Optional): The file extension for the note. Defaults to `md` if left empty.
    -   `UpdatedIn` (Type: `Formula Field`): Used for incremental sync. The plugin uses this timestamp to determine which notes need updating.
        -   For example, you can have a date field named `Note Update Date`.
        -   Then, in the `UpdatedIn` field, use `DATEDIF(TODAY(),[Note Update Date],"days")` to get how many days ago the note was last updated.

3.  **Authorize the Table**:
    -   Click the **···** icon in the upper-right corner of the table.
    -   Select **More** from the appearing panel.
    -   Select **Add Document App** from the pop-up menu.
    -   Search for and select the custom app you just created, and ensure it has **Editable** permissions (although the plugin only reads, Feishu's authorization mechanism requires this setting).

4.  **Copy the Table Link**:
    -   Open your Bitable in a browser.
    -   Copy the full URL from the address bar.
    -   **Note**: The URL must be in a format that includes `base`, `table`, and `view` parameters, for example:
        ```
        https://feishu.cn/base/BASExxxxxxxxxxxxxxx?table=TBLxxxxxxxxxxxxxx&view=VEWxxxxxxxxxxxxxx
        ```
    -   Do not use links from `wiki` pages or share pages.

### (II) Obsidian Setup

#### 1. Install the Plugin

-   It is recommended to use the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin for installation.
-   In BRAT, add a beta plugin and enter the GitHub repository address for this plugin.

#### 2. Configure the Plugin

1.  Enable the Feishu Fetcher plugin in Obsidian.
2.  Open the plugin settings page.
3.  Click **+ Add New Data Source** to create a new data source.
4.  In the edit modal that appears, fill in the following information:
    -   **Data Source Name**: Give your data source a descriptive name (e.g., "My Reading Notes"). This name will appear in the command palette.
    -   **Data Source URL**: Paste the Bitable link you copied earlier.
    -   **APP ID**: Paste your custom app's App ID.
    -   **App Secret**: Paste your custom app's App Secret.
    -   **Target Path**: Set a folder path in your Obsidian vault where notes fetched from Feishu will be stored (e.g., `Feishu Notes`). The plugin will create the folder if it doesn't exist.
5.  Click **Save** to save the settings.

### (III) How to Use

1.  Press `Ctrl+P` (or `Cmd+P`) to open the Obsidian command palette.
2.  Search for "Feishu Fetcher," and you will see commands generated for each of your configured data sources, in the format `Get [Your Data Source Name]`.
3.  Select the command for the data source you want to sync and press Enter.
4.  The plugin will prompt you to select an update time range (e.g., "Notes updated in the last day" or "All notes").
5.  After selection, the plugin will start fetching data and create or update notes in the specified target path.

---

## Import and Export Configurations

To facilitate syncing settings between different devices, the plugin provides import and export functionality.

-   **Export All Fetch Sources**: Exports all data source configurations (excluding App Secret) to the clipboard.
-   **Import New Fetch Sources**: Pastes JSON-formatted configurations from the clipboard to quickly add data sources.

> **Security Notice**: The exported configuration does not include the `App Secret`. You will need to re-enter it manually after importing. Please keep your credentials secure.
