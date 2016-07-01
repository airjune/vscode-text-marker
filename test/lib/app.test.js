
const App = require('../../lib/app');

// TODO: Too much fake object setup, decompose implementation

suite('App', () => {

    suite('#markText', () => {

        test('it highlights all the strings equal to the selected string', () => {
            const editor = fakeEditor('SELECTED', 'STR1 SELECTED STR2 SELECTED');
            const vscode = fakeVscode(editor);
            const logger = getLogger();
            const decorationRegistry = {
                inquire: () => null,
                issue: stubWithArgs(['SELECTED'], 'DECORATION_TYPE')
            };
            new App({decorationRegistry, vscode, logger}).markText(editor);

            expect(vscode.window.visibleTextEditors[0].setDecorations).to.have.been.calledWith(
                'DECORATION_TYPE',
                [
                    {start: 'POSITION:5', end: 'POSITION:13'},
                    {start: 'POSITION:19', end: 'POSITION:27'}
                ]
            );
        });

        test('Selecting already selected text is de-highlights the selected strings', () => {
            const editor = fakeEditor('SELECTED', 'STR1 SELECTED STR2 SELECTED');
            const vscode = fakeVscode(editor);
            const logger = getLogger();
            const decorationRegistry = {
                inquire: stubWithArgs(['SELECTED'], 'DECORATION_TYPE')
            };
            new App({decorationRegistry, vscode, logger}).markText(editor);

            expect(vscode.window.visibleTextEditors[0].setDecorations).to.have.been.calledWith(
                'DECORATION_TYPE',
                []
            );
        });
    });

    function fakeEditor(selectedText, entireText) {
        return {
            selection: {
                text: selectedText,
                isEmpty: !selectedText
            },
            document: {
                getText: selection => selection ? selection.text : entireText,
                positionAt: offset => `POSITION:${offset}`
            },
            setDecorations: sinon.spy()
        };
    }

    function fakeVscode(editor) {
        const Range = function (position1, position2) {
            return {start: position1, end: position2};
        };
        return {
            window: {visibleTextEditors: [editor]},
            Range
        };
    }

    function getLogger() {
        return console;
    }
});
