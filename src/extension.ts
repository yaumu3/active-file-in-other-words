import * as vscode from 'vscode';
import * as path from 'path';

export function activate({ subscriptions, extensionUri }: vscode.ExtensionContext) {
    const viewProvider = new DescriptionViewProvider(extensionUri);
    subscriptions.push(vscode.window.registerWebviewViewProvider(DescriptionViewProvider.viewType, viewProvider));

    const showDescriptionCommandId = 'active-file-in-other-words.showDescription';
    subscriptions.push(vscode.commands.registerCommand(showDescriptionCommandId, async () => {
        await vscode.commands.executeCommand('active-file-in-other-words.descriptionView.focus');
    }));

    const aliasMap = new Map<string, string>();

    // Create a new status bar item that we can now manage
    const fileAliasStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    fileAliasStatusBarItem.command = showDescriptionCommandId;
    subscriptions.push(fileAliasStatusBarItem);

    const reloadAliasMap = () => reloadMapFromConfiguration(aliasMap, MapEntryKey.alias);
    const updateStatusBar = () => updateStatuBarItem(aliasMap, fileAliasStatusBarItem);

    // Register an event listener that make sure the maps always up-to-date.
    subscriptions.push(vscode.workspace.onDidChangeConfiguration(reloadAliasMap));
    // Register an event listener that make sure the status bar item always up-to-date.
    subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));

    // Update once at start
    reloadAliasMap();
    updateStatusBar();
}

enum MapEntryKey {
    baseName = "baseName",
    alias = "alias",
    description = "description",
}
interface MapEntry {
    baseName: string, alias: string, description: string
}

function reloadMapFromConfiguration(map: Map<string, string>, key: MapEntryKey) {
    map.clear();
    const config = vscode.workspace.getConfiguration("active-file-in-other-words");
    const entries = config.get<MapEntry[]>('maps') || [];

    for (let entry of entries) {
        map.set(entry[MapEntryKey.baseName], entry[key]);
    }
}

function getValueFromMapByActiveFileBaseName(map: Map<string, string>): string | undefined {
    const activateFileName = vscode.window.activeTextEditor?.document.fileName;
    if (activateFileName === undefined) { return undefined; }
    const activeFileBaseName = path.parse(activateFileName).base;
    const value = map.get(activeFileBaseName);
    if (value === undefined) { return undefined; }
    return value;
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

class DescriptionViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'active-file-in-other-words.descriptionView';

    private panel?: vscode.WebviewView;
    private descriptionMap: Map<string, string>;

    constructor(private readonly _extensionUri: vscode.Uri,) {
        this.descriptionMap = new Map<string, string>();
        const reloadDescriptionMap = () => reloadMapFromConfiguration(this.descriptionMap, MapEntryKey.description);
        vscode.workspace.onDidChangeConfiguration(reloadDescriptionMap);
        reloadDescriptionMap();
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ],
        };

        webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
        webviewView.onDidChangeVisibility(() => { webviewView.visible && this.refresh(); });
        this.panel = webviewView;
        vscode.window.onDidChangeActiveTextEditor(() => { this.refresh(); });
        this.refresh();
    }

    public refresh() {
        if (this.panel) {
            const description = getValueFromMapByActiveFileBaseName(this.descriptionMap) || "";
            this.panel.webview.postMessage({ type: 'refresh', data: { description: description } });
        }
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private getHtmlForWebview(webview: vscode.Webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const nonce = this.getNonce();

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleResetUri}" rel="stylesheet">
                <link href="${styleVSCodeUri}" rel="stylesheet">
                <title>File description</title>
            </head>
            <body>
                <div id="app"></div>
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}
