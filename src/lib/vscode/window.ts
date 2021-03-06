import * as vscode from 'vscode';
import {DecorationRenderOptions, InputBoxOptions, QuickPickOptions, TextEditorDecorationType} from 'vscode';
import TextEditor from './text-editor';
import * as O from 'fp-ts/lib/Option';
import * as T from 'fp-ts/lib/Task';
import {pipe} from 'fp-ts/lib/pipeable';

type QuickPickItemWithoutDescription = Pick<vscode.QuickPickItem, Exclude<keyof vscode.QuickPickItem, 'description'>>;

export interface QuickPickItem extends QuickPickItemWithoutDescription {
    description?: string;
}

export default class WindowComponent {
    private readonly window: typeof vscode.window;

    constructor(window: typeof vscode.window) {
        this.window = window;
    }

    get visibleTextEditors(): TextEditor[] {
        return this.window.visibleTextEditors
            .map(editor => new TextEditor(editor));
    }

    get activeTextEditor(): TextEditor | undefined {
        const editor = this.window.activeTextEditor;
        return editor && new TextEditor(editor);
    }

    showInputBox(options: InputBoxOptions): T.Task<O.Option<string>> {
        return pipe(
            () => this.window.showInputBox(options) as Promise<string>,
            T.map(O.fromPredicate((s: string) => !!s))
        );
    }

    showInformationMessage(message: string): T.Task<string> {
        return () => this.window.showInformationMessage(message) as Promise<string>;
    }

    showQuickPick<U extends QuickPickItem>(selectItems: U[], options: QuickPickOptions): T.Task<O.Option<U>> {
        const items = this.fillDescription(selectItems);
        return pipe(
            () => this.window.showQuickPick(items, options) as Promise<U>,
            T.map(O.fromNullable)
        );
    }

    createTextEditorDecorationType(options: DecorationRenderOptions): TextEditorDecorationType {
        return this.window.createTextEditorDecorationType(options);
    }

    private fillDescription<U extends QuickPickItem>(selectItems: U[]) {
        return selectItems.map(item =>
            Object.assign({}, item, {description: item.description || ''})
        );
    }
}
