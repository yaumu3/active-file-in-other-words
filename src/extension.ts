import * as vscode from 'vscode';
import * as path from 'path';

export function activate({ subscriptions }: vscode.ExtensionContext) {
    const [aliasMap, descriptionMap] = loadMapsFromConfiguration();

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

    const updateStatusBarItemWithActiveFileAlias = () => updateStatuBarItem(aliasMap, fileAliasStatusBarItem);

    // Register some listener that make sure the status bar item always up-to-date.
    // TODO: Rebuild descriptionMap, aliasMap and updater when some configurations are changed
    subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBarItemWithActiveFileAlias));

    // Update once at start
    updateStatusBarItemWithActiveFileAlias();
}

interface MapEntry {
    baseName: string, alias: string, description: string
}

function loadMapsFromConfiguration(): [Map<string, string>, Map<string, string>] {
    const aliasMap = new Map<string, string>();
    const descriptionMap = new Map<string, string>();
    const config = vscode.workspace.getConfiguration("active-file-in-other-words");
    const maps = config.get<MapEntry[]>('maps');
    if (maps === undefined) { return [aliasMap, descriptionMap]; }

    for (let map of maps) {
        aliasMap.set(map.baseName, map.alias);
        descriptionMap.set(map.baseName, map.description);
    }
    return [aliasMap, descriptionMap];
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
