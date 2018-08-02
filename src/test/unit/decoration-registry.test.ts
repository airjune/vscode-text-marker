import {expect, mockType, stubReturns} from '../helpers/helper';

import DecorationRegistry from '../../lib/decoration-registry';
import PatternFactory from '../../lib/pattern-factory';
import MatchingModeRegistry from "../../lib/matching-mode-registry";

suite('DecorationRegistry', () => {

    test('it registers a pattern and returns registry information', () => {
        const registry = createDecorationRegistry();

        const pattern = createPattern('PATTERN');
        expect(registry.issue(pattern)).to.eql({
            id: 'UUID_1',
            colour: 'pink',
            decorationType: 'DECORATION_TYPE_1',
            pattern
        });
    });

    test('it does not register the same pattern multiple times', () => {
        const colourRegistry = {issue: stubReturns('pink', 'yellow')};
        const registry = createDecorationRegistry({colourRegistry});

        registry.issue(createPattern('PATTERN'));
        const secondResult = registry.issue(createPattern('PATTERN'));

        expect(secondResult).to.be.null;
        expect(colourRegistry.issue).to.have.been.calledOnce;
    });

    test('it returns a registered decoration type for the passed decoration id', () => {
        const registry = createDecorationRegistry();

        const pattern = createPattern('PATTERN');
        registry.issue(createPattern('PATTERN'));

        expect(registry.inquireById('UUID_1')).to.eql({
            id: 'UUID_1',
            colour: 'pink',
            decorationType: 'DECORATION_TYPE_1',
            pattern
        });
    });

    test('it returns a registered decoration type for the passed regex', () => {
        const registry = createDecorationRegistry();

        const pattern = createPattern('PATTERN');
        registry.issue(pattern);

        expect(registry.inquireByPattern(pattern)).to.eql({
            id: 'UUID_1',
            colour: 'pink',
            decorationType: 'DECORATION_TYPE_1',
            pattern: pattern
        });
    });

    test("it can remove given pattern and it's associated decoration type from the registry", () => {
        const registry = createDecorationRegistry();

        const pattern = createPattern('PATTERN');
        const decorationId = registry.issue(pattern).id;
        registry.revoke(decorationId);
        expect(registry.inquireByPattern(pattern)).to.be.null;
    });

    test('it can return all registered decorations at once', () => {
        const registry = createDecorationRegistry();
        const pattern1 = createPattern('PATTERN_1');
        const pattern2 = createPattern('PATTERN_2');
        registry.issue(pattern1);
        registry.issue(pattern2);
        expect(registry.retrieveAll()).to.eql([
            {
                id: 'UUID_1',
                colour: 'pink',
                pattern: pattern1,
                decorationType: 'DECORATION_TYPE_1'
            },
            {
                id: 'UUID_2',
                colour: 'yellow',
                pattern: pattern2,
                decorationType: 'DECORATION_TYPE_2'
            }
        ]);
    });

    test('it does not return revoked decorations', () => {
        const registry = createDecorationRegistry();
        const pattern1 = createPattern('PATTERN_1');
        const pattern2 = createPattern('PATTERN_2');
        registry.issue(pattern1);
        registry.issue(pattern2);
        registry.revoke('UUID_1');

        expect(registry.retrieveAll()).to.eql([
            {
                id: 'UUID_2',
                colour: 'yellow',
                pattern: pattern2,
                decorationType: 'DECORATION_TYPE_2'
            }
        ]);
    });

    test('it issues new decoration with new color', () => {
        const window = {createTextEditorDecorationType: stubReturns('DECORATION_TYPE_1', 'DECORATION_TYPE_2')};
        const registry = createDecorationRegistry({window});

        registry.issue(createPattern('TEXT_1'));
        registry.issue(createPattern('TEXT_2'));

        expect(window.createTextEditorDecorationType.args).to.eql([
            [{
                backgroundColor: 'pink',
                borderRadius: '.2em',
                overviewRulerColor: 'violet',
                overviewRulerLane: 2
            }],
            [{
                backgroundColor: 'yellow',
                borderRadius: '.2em',
                overviewRulerColor: 'violet',
                overviewRulerLane: 2
            }]
        ]);
    });

    test('it toggles the case sensitivity of a pattern', () => {
        const registry = createDecorationRegistry();

        const oldPattern = createPattern('TEXT');
        const newPattern = createPattern('TEXT');
        registry.issue(oldPattern);

        expect(registry.updatePattern('UUID_1', newPattern)).to.eql({
            id: 'UUID_1',
            colour: 'pink',
            decorationType: 'DECORATION_TYPE_1',
            pattern: newPattern
        });
    });

    test('it use the text highlight colour on the ruler', () => {
        const window = {createTextEditorDecorationType: stubReturns('DECORATION_TYPE_1')};
        const configStore = createConfigStore({useHighlightColorOnRuler: true});
        const registry = createDecorationRegistry({configStore, window});

        const pattern = createPattern('TEXT');
        registry.issue(pattern);

        expect(window.createTextEditorDecorationType.args).to.eql([
            [{
                backgroundColor: 'pink',
                borderRadius: '.2em',
                overviewRulerColor: 'pink',
                overviewRulerLane: 2
            }]
        ]);
    });

    test('it use the high contrast colour for text with highlights', () => {
        const window = {createTextEditorDecorationType: stubReturns('DECORATION_TYPE_1')};
        const configStore = createConfigStore({autoSelectDistinctiveTextColor: true});
        const registry = createDecorationRegistry({configStore, window});

        const pattern = createPattern('TEXT');
        registry.issue(pattern);

        expect(window.createTextEditorDecorationType.args).to.eql([
            [{
                backgroundColor: 'pink',
                borderRadius: '.2em',
                color: '#545454',
                overviewRulerColor: 'violet',
                overviewRulerLane: 2
            }]
        ]);
    });

    function createDecorationRegistry(options: any = {}) {
        const window = options.window || {
            createTextEditorDecorationType: stubReturns('DECORATION_TYPE_1', 'DECORATION_TYPE_2')
        };
        const colourRegistry = options.colourRegistry || {
            issue: stubReturns('pink', 'yellow'),
            revoke: () => {}
        };
        const generateUuid = createGenerateUuid();
        const configStore = options.configStore || createConfigStore();
        return new DecorationRegistry(configStore, colourRegistry, window, generateUuid);
    }

    function createConfigStore({useHighlightColorOnRuler, autoSelectDistinctiveTextColor}: any = {}) {
        return {
            useHighlightColorOnRuler: !!useHighlightColorOnRuler,
            autoSelectDistinctiveTextColor: !!autoSelectDistinctiveTextColor
        };
    }

    function createPattern(phrase) {
        const matchingModeRegistry = mockType<MatchingModeRegistry>({mode: {ignoreCase: false}});
        return new PatternFactory(matchingModeRegistry).create({phrase});
    }

    function createGenerateUuid() {
        let i = 1;
        return () => `UUID_${i++}`;
    }

});
