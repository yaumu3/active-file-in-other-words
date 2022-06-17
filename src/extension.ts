import * as vscode from 'vscode';
import * as path from 'path';

export function activate({ subscriptions }: vscode.ExtensionContext) {
    const aliasMap = new Map<string, string>();
    const descriptionMap = new Map<string, string>();

    // Register a command that is invoked when the status bar item is selected
    const showDescriptionCommandId = 'active-file-in-other-words.showActiveFileDescription';
    subscriptions.push(vscode.commands.registerCommand(showDescriptionCommandId, () => {
        const description = getValueFromMapByActiveFileBaseName(descriptionMap);
        if (description === undefined) { return; }
        vscode.window.showInformationMessage(description);
    }));

    // Create a new status bar item that we can now manage
    const fileAliasStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    fileAliasStatusBarItem.command = showDescriptionCommandId;
    subscriptions.push(fileAliasStatusBarItem);

    const reloadMaps = () => reloadMapsFromConfiguration(aliasMap, descriptionMap);
    const updateStatusBar = () => updateStatuBarItem(aliasMap, fileAliasStatusBarItem);

    // Register an event listener that make sure the maps always up-to-date.
    subscriptions.push(vscode.workspace.onDidChangeConfiguration(reloadMaps));
    // Register an event listener that make sure the status bar item always up-to-date.
    subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));

    // Update once at start
    reloadMaps();
    updateStatusBar();
}

interface MapEntry {
    baseName: string, alias: string, description: string
}

function reloadMapsFromConfiguration(aliasMap: Map<string, string>, descriptionMap: Map<string, string>) {
    aliasMap.clear();
    descriptionMap.clear();
    const config = vscode.workspace.getConfiguration("active-file-in-other-words");
    const maps = config.get<MapEntry[]>('maps') || [];

    for (let map of maps) {
        aliasMap.set(map.baseName, map.alias);
        descriptionMap.set(map.baseName, map.description);
    }
}

function updateStatuBarItem(aliasMap: Map<string, string>, statusBarItem: vscode.StatusBarItem): void {
    let alias = getValueFromMapByActiveFileBaseName(aliasMap);
    if (alias === undefined) {
        statusBarItem.hide();
        return;
    }
    statusBarItem.text = `$(note) ${alias}`;
    statusBarItem.show();
}

function getValueFromMapByActiveFileBaseName(map: Map<string, string>): string | undefined {
    const activateFileName = vscode.window.activeTextEditor?.document.fileName;
    if (activateFileName === undefined) { return undefined; }
    const activeFileBaseName = path.parse(activateFileName).base;
    const value = map.get(activeFileBaseName);
    if (value === undefined) { return undefined; }
    return value;
}
