const _ = require('lodash');

const with_cases = require('./spec_helper').with_cases;

const chai = require('chai');
const expect = chai.expect;
chai.should();

const create_model = require('../src/model');

const dungeon = ({ opened = 0, medallion = 0 }) => {
    return {
        update(model, region) {
            _.times(opened, () => model.lower_chest(region));
            _.times(medallion, () => model.raise_medallion(region));
        },
        toString() {
            const parts = _.compact([
                medallion && `medallion ${medallion}`,
                opened && `${opened} opened chests`
            ]);
            return parts.length ?
                `dungeon with ${parts.join(', ')}` :
                'initial dungeon';
        }
    }
};

dungeon.initial = dungeon({});

const inventory = (tokens = null) => {
    tokens = tokens ? tokens.split(' ') : [];
    return {
        update(model) {
            const raise = {
                fightersword: ['sword', 1],
                mirrorshield: ['shield', 3],
                bow: ['bow', 2],
                bottle: ['bottle', 1],
                glove: ['glove', 1],
                mitt: ['glove', 2]
            };
            tokens.forEach(token => {
                const item = raise[token];
                const action = item ?
                    ([item, n]) => _.times(n, () => model.raise_item(item)) :
                    ([item]) => model.toggle_item(item);
                action(item || [token]);
            });
        },
        toString() {
            return tokens.length ?
                `with ${tokens.join(', ')}` :
                'without any items';
        }
    }
};

inventory.none = inventory();

const as = state => `as ${
    state === true ? 'available' :
    state === false ? 'unavailable' :
    state}`;

const defeated = agahnim => agahnim ? ' and agahnim defeated' : '';

describe('Model', () => {

    let model;

    beforeEach(() => {
        model = create_model();
    });

    context('dungeons', () => {

        context('eastern palace', () => {

            with_cases(
            [inventory.none, false],
            [inventory('bow'), 'dark'],
            [inventory('lamp bow'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.eastern.completable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory.none, true],
            [dungeon({ opened: 1 }), inventory.none, 'possible'],
            [dungeon({ opened: 2 }), inventory.none, 'possible'],
            [dungeon({ opened: 1 }), inventory('lamp'), true],
            [dungeon({ opened: 2 }), inventory('lamp bow'), true],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'eastern');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.eastern.progressable.should.equal(state);
            }));

        });

        context('desert palace', () => {

            with_cases(
            [inventory.none, false],
            [inventory('glove lamp fightersword boots'), false],
            [inventory('book glove lamp fightersword'), 'possible'],
            [inventory('book glove lamp hammer'), 'possible'],
            [inventory('book glove lamp bow'), 'possible'],
            [inventory('book glove lamp icerod'), 'possible'],
            [inventory('book glove lamp somaria'), 'possible'],
            [inventory('book glove lamp byrna'), 'possible'],
            [inventory('book glove firerod'), 'possible'],
            [inventory('book glove lamp fightersword boots'), true],
            [inventory('book glove lamp hammer boots'), true],
            [inventory('book glove lamp bow boots'), true],
            [inventory('book glove lamp icerod boots'), true],
            [inventory('book glove lamp somaria boots'), true],
            [inventory('book glove lamp byrna boots'), true],
            [inventory('book glove firerod boots'), true],
            [inventory('mirror mitt flute lamp fightersword'), 'possible'],
            [inventory('mirror mitt flute lamp hammer'), 'possible'],
            [inventory('mirror mitt flute lamp bow'), 'possible'],
            [inventory('mirror mitt flute lamp icerod'), 'possible'],
            [inventory('mirror mitt flute lamp somaria'), 'possible'],
            [inventory('mirror mitt flute lamp byrna'), 'possible'],
            [inventory('mirror mitt flute firerod'), 'possible'],
            [inventory('mirror mitt flute lamp fightersword boots'), true],
            [inventory('mirror mitt flute lamp hammer boots'), true],
            [inventory('mirror mitt flute lamp bow boots'), true],
            [inventory('mirror mitt flute lamp icerod boots'), true],
            [inventory('mirror mitt flute lamp somaria boots'), true],
            [inventory('mirror mitt flute lamp byrna boots'), true],
            [inventory('mirror mitt flute firerod boots'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.desert.completable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('boots'), false],
            [dungeon.initial, inventory('book'), 'possible'],
            [dungeon.initial, inventory('book boots'), true],
            [dungeon({ opened: 1}), inventory('book boots glove lamp'), true],
            [dungeon({ opened: 1}), inventory('book boots glove firerod'), true],
            [dungeon.initial, inventory('mirror mitt flute'), 'possible'],
            [dungeon.initial, inventory('mirror mitt flute boots'), true],
            [dungeon({ opened: 1}), inventory('mirror mitt flute boots lamp'), true],
            [dungeon({ opened: 1}), inventory('mirror mitt flute boots firerod'), true],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'desert');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.desert.progressable.should.equal(state);
            }));

        });

        context('tower of hera', () => {

            with_cases(
            [inventory.none, false],
            [inventory('fightersword firerod'), false],
            [inventory('mirror flute fightersword firerod'), true],
            [inventory('mirror flute hammer firerod'), true],
            [inventory('mirror flute fightersword lamp'), true],
            [inventory('mirror flute hammer lamp'), true],
            [inventory('mirror flute fightersword'), 'possible'],
            [inventory('mirror flute hammer'), 'possible'],
            [inventory('mirror glove lamp fightersword'), true],
            [inventory('mirror glove lamp hammer'), true],
            [inventory('hookshot hammer flute firerod'), true],
            [inventory('hookshot hammer flute lamp'), true],
            [inventory('hookshot hammer flute'), 'possible'],
            [inventory('hookshot hammer glove lamp'), true],
            [inventory('mirror glove fightersword'), 'possible'],
            [inventory('mirror glove hammer'), 'possible'],
            [inventory('mirror glove fightersword firerod'), 'dark'],
            [inventory('mirror glove hammer firerod'), 'dark'],
            [inventory('hookshot hammer glove'), 'possible'],
            [inventory('hookshot hammer glove firerod'), 'dark'],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.hera.completable.should.equal(state);
            }));

            with_cases(
            [inventory.none, false],
            [inventory('firerod'), false],
            [inventory('mirror flute firerod'), true],
            [inventory('mirror flute lamp'), true],
            [inventory('mirror flute'), 'possible'],
            [inventory('mirror glove lamp'), true],
            [inventory('hookshot hammer flute firerod'), true],
            [inventory('hookshot hammer flute lamp'), true],
            [inventory('hookshot hammer flute'), 'possible'],
            [inventory('hookshot hammer glove lamp'), true],
            [inventory('mirror glove'), 'possible'],
            [inventory('mirror glove firerod'), 'dark'],
            (inventory, state) => it(`show progressable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.hera.progressable.should.equal(state);
            }));

        });

        context('palace of darkness', () => {

            with_cases(
            [false, inventory.none, false],
            [false, inventory('bow hammer lamp'), false],
            [false, inventory('moonpearl glove hammer bow lamp'), true],
            [false, inventory('moonpearl glove hammer bow'), 'dark'],
            [true, inventory('moonpearl bow hammer lamp'), true],
            [true, inventory('moonpearl bow hammer'), 'dark'],
            (agahnim, inventory, state) => it(`show completable ${as(state)} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.darkness.completable.should.equal(state);
            }));

            with_cases(
            [false, dungeon.initial, inventory.none, false],
            [false, dungeon.initial, inventory('bow lamp'), false],
            [false, dungeon.initial, inventory('moonpearl glove hammer bow lamp'), true],
            [false, dungeon.initial, inventory('moonpearl glove hammer'), 'possible'],
            [false, dungeon({ opened: 4 }), inventory('moonpearl mitt flippers bow lamp hammer'), true],
            [false, dungeon({ opened: 4 }), inventory('moonpearl mitt flippers bow lamp'), 'possible'],
            [false, dungeon.initial, inventory('moonpearl mitt flippers'), 'possible'],
            [true, dungeon.initial, inventory('moonpearl bow lamp'), true],
            [true, dungeon.initial, inventory('moonpearl'), 'possible'],
            [true, dungeon({ opened: 4 }), inventory('moonpearl bow lamp hammer'), true],
            [true, dungeon({ opened: 4 }), inventory('moonpearl bow lamp'), 'possible'],
            (agahnim, dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                dungeon.update(model, 'darkness');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.darkness.progressable.should.equal(state);
            }));

        });

        context('swamp palace', () => {

            with_cases(
            [false, inventory.none, false],
            [false, inventory('hammer hookshot'), false],
            [false, inventory('moonpearl mirror flippers glove hammer hookshot'), true],
            [true, inventory('moonpearl mirror flippers hammer hookshot'), true],
            (agahnim, inventory, state) => it(`show completable ${as(state)} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.swamp.completable.should.equal(state);
            }));

            with_cases(
            [false, dungeon.initial, inventory.none, false],
            [false, dungeon.initial, inventory('hammer'), false],
            [false, dungeon.initial, inventory('moonpearl mirror flippers glove hammer'), true],
            [false, dungeon.initial, inventory('moonpearl mirror flippers mitt'), 'possible'],
            [false, dungeon({ opened: 1 }), inventory('moonpearl mirror flippers glove hammer'), true],
            [false, dungeon({ opened: 2 }), inventory('moonpearl mirror flippers glove hammer hookshot'), true],
            [false, dungeon({ opened: 2 }), inventory('moonpearl mirror flippers glove hammer'), 'possible'],
            [false, dungeon({ opened: 4 }), inventory('moonpearl mirror flippers glove hammer hookshot'), true],
            [true, dungeon.initial, inventory('moonpearl mirror flippers hammer'), true],
            [true, dungeon.initial, inventory('moonpearl mirror flippers hookshot'), 'possible'],
            [true, dungeon({ opened: 1 }), inventory('moonpearl mirror flippers hammer'), true],
            [true, dungeon({ opened: 2 }), inventory('moonpearl mirror flippers hammer hookshot'), true],
            [true, dungeon({ opened: 2 }), inventory('moonpearl mirror flippers hammer'), 'possible'],
            [true, dungeon({ opened: 4 }), inventory('moonpearl mirror flippers hammer hookshot'), true],
            (agahnim, dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                dungeon.update(model, 'swamp');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.swamp.progressable.should.equal(state);
            }));

        });

        context('skull woods', () => {

            with_cases(
            [false, inventory.none, false],
            [false, inventory('firerod fightersword'), false],
            [false, inventory('moonpearl glove hammer firerod fightersword'), true],
            [true, inventory('moonpearl hookshot flippers firerod fightersword'), true],
            [true, inventory('moonpearl hookshot glove firerod fightersword'), true],
            [true, inventory('moonpearl hookshot hammer firerod fightersword'), true],
            (agahnim, inventory, state) => it(`show completable ${as(state)} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.skull.completable.should.equal(state);
            }));

            with_cases(
            [false, dungeon.initial, inventory.none, false],
            [false, dungeon.initial, inventory('firerod'), false],
            [false, dungeon.initial, inventory('moonpearl glove hammer firerod'), true],
            [false, dungeon.initial, inventory('moonpearl mitt firerod'), true],
            [false, dungeon({ opened: 1 }), inventory('moonpearl glove hammer firerod fightersword'), true],
            [false, dungeon({ opened: 1 }), inventory('moonpearl mitt firerod fightersword'), true],
            [false, dungeon({ opened: 1 }), inventory('moonpearl glove hammer'), 'possible'],
            [false, dungeon({ opened: 1 }), inventory('moonpearl mitt'), 'possible'],
            [true, dungeon.initial, inventory('moonpearl hookshot flippers firerod'), true],
            [true, dungeon.initial, inventory('moonpearl hookshot glove firerod'), true],
            [true, dungeon.initial, inventory('moonpearl hookshot hammer firerod'), true],
            [true, dungeon({ opened: 1 }), inventory('moonpearl hookshot flippers firerod fightersword'), true],
            [true, dungeon({ opened: 1 }), inventory('moonpearl hookshot glove firerod fightersword'), true],
            [true, dungeon({ opened: 1 }), inventory('moonpearl hookshot hammer firerod fightersword'), true],
            [true, dungeon({ opened: 1 }), inventory('moonpearl hookshot flippers'), 'possible'],
            [true, dungeon({ opened: 1 }), inventory('moonpearl hookshot glove'), 'possible'],
            [true, dungeon({ opened: 1 }), inventory('moonpearl hookshot hammer'), 'possible'],
            (agahnim, dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                dungeon.update(model, 'skull');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.skull.progressable.should.equal(state);
            }));

        });

        context("thieves' town", () => {

            with_cases(
            [false, inventory.none, false],
            [false, inventory('fightersword'), false],
            [false, inventory('moonpearl glove hammer'), true],
            [false, inventory('moonpearl mitt fightersword'), true],
            [false, inventory('moonpearl mitt somaria'), true],
            [false, inventory('moonpearl mitt byrna'), true],
            [true, inventory('moonpearl hookshot flippers fightersword'), true],
            [true, inventory('moonpearl hookshot flippers somaria'), true],
            [true, inventory('moonpearl hookshot flippers byrna'), true],
            [true, inventory('moonpearl hookshot glove fightersword'), true],
            [true, inventory('moonpearl hookshot glove somaria'), true],
            [true, inventory('moonpearl hookshot glove byrna'), true],
            [true, inventory('moonpearl hookshot hammer'), true],
            (agahnim, inventory, state) => it(`show completable ${as(state)} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.thieves.completable.should.equal(state);
            }));

            with_cases(
            [false, dungeon.initial, inventory.none, false],
            [false, dungeon.initial, inventory('hammer'), false],
            [false, dungeon.initial, inventory('moonpearl glove hammer'), true],
            [false, dungeon.initial, inventory('moonpearl mitt'), true],
            [false, dungeon({ opened: 3 }), inventory('moonpearl glove hammer'), true],
            [false, dungeon({ opened: 3 }), inventory('moonpearl mitt'), 'possible'],
            [true, dungeon.initial, inventory('moonpearl hookshot flippers'), true],
            [true, dungeon.initial, inventory('moonpearl hookshot glove'), true],
            [true, dungeon.initial, inventory('moonpearl hookshot hammer'), true],
            [true, dungeon({ opened: 3 }), inventory('moonpearl hookshot flippers'), 'possible'],
            [true, dungeon({ opened: 3 }), inventory('moonpearl hookshot glove'), 'possible'],
            [true, dungeon({ opened: 3 }), inventory('moonpearl hookshot hammer'), true],
            (agahnim, dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}${defeated(agahnim)}`, () => {
                agahnim && model.toggle_completion('castle_tower');
                dungeon.update(model, 'thieves');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.thieves.progressable.should.equal(state);
            }));

        });

        context('ice palace', () => {

            with_cases(
            [inventory.none, false],
            [inventory('hammer somaria'), false],
            [inventory('moonpearl flippers mitt firerod hammer somaria'), true],
            [inventory('moonpearl flippers mitt firerod hammer hookshot'), true],
            [inventory('moonpearl flippers mitt firerod hammer'), 'possible'],
            [inventory('moonpearl flippers mitt bombos fightersword hammer somaria'), true],
            [inventory('moonpearl flippers mitt bombos fightersword hammer hookshot'), true],
            [inventory('moonpearl flippers mitt bombos fightersword hammer'), 'possible'],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.ice.completable.should.equal(state);
            }));

            with_cases(
            [inventory.none, false],
            [inventory('hammer'), false],
            [inventory('moonpearl flippers mitt firerod hammer'), true],
            [inventory('moonpearl flippers mitt firerod'), 'possible'],
            [inventory('moonpearl flippers mitt bombos fightersword hammer'), true],
            [inventory('moonpearl flippers mitt bombos fightersword'), 'possible'],
            (inventory, state) => it(`shows progressable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.ice.progressable.should.equal(state);
            }));

        });

        context('misery mire', () => {

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('somaria bombos ether quake lamp'), false],
            [dungeon.initial, inventory('moonpearl boots fightersword flute mitt somaria bombos ether quake lamp'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl boots fightersword flute mitt somaria bombos lamp'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl boots fightersword flute mitt somaria ether lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots fightersword flute mitt somaria quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots fightersword flute mitt somaria quake firerod'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots fightersword flute mitt somaria quake'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot fightersword flute mitt somaria quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot fightersword flute mitt somaria quake firerod'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot fightersword flute mitt somaria quake'), 'possible'],
            (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'mire');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.mire.completable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('bombos ether quake firerod'), false],
            [dungeon.initial, inventory('moonpearl boots fightersword flute mitt bombos ether quake firerod'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl boots fightersword flute mitt bombos firerod'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl boots fightersword flute mitt ether firerod'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots fightersword flute mitt quake firerod'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots fightersword flute mitt quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots fightersword flute mitt quake'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot fightersword flute mitt quake firerod'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot fightersword flute mitt quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot fightersword flute mitt quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl boots fightersword flute mitt quake lamp somaria'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl boots fightersword flute mitt quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl hookshot fightersword flute mitt quake lamp somaria'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl hookshot fightersword flute mitt quake'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'mire');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.mire.progressable.should.equal(state);
            }));

        });

        context('turtle rock', () => {

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('icerod firerod bombos ether quake byrna lamp'), false],
            [dungeon.initial, inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod bombos ether quake byrna lamp'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod bombos byrna lamp'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod ether byrna lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod quake byrna lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod quake byrna'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod quake cape lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod quake cape'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod quake mirrorshield lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod quake mirrorshield'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror icerod firerod quake'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot icerod firerod quake byrna lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot icerod firerod quake byrna'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot icerod firerod quake cape lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot icerod firerod quake cape'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot icerod firerod quake mirrorshield lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot icerod firerod quake mirrorshield'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot icerod firerod quake'), 'possible'],
            (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'turtle');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.turtle.completable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('bombos ether quake firerod lamp'), false],
            [dungeon.initial, inventory('moonpearl mitt hammer somaria fightersword mirror bombos ether quake firerod lamp'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror bombos firerod lamp'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl mitt hammer somaria fightersword mirror ether firerod lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake firerod lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword mirror quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake firerod lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria fightersword hookshot quake mirrorshield'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'turtle');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.turtle.progressable.should.equal(state);
            }));

        });

    });

    context('lightworld locations', () => {

        with_cases(
        ['lightworld_deathmountain_west', 'ether', inventory.none, false],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory.none, false],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('flute mirror'), true],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('flute'), 'viewable'],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('glove lamp mirror'), true],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('glove'), 'viewable'],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('glove mirror'), 'dark'],
        ['lightworld_deathmountain_west', 'spectacle_cave', inventory.none, false],
        ['lightworld_deathmountain_west', 'spectacle_cave', inventory('flute'), true],
        ['lightworld_deathmountain_west', 'spectacle_cave', inventory('glove lamp'), true],
        ['lightworld_deathmountain_west', 'spectacle_cave', inventory('glove'), 'dark'],
        ['lightworld_deathmountain_west', 'old_man', inventory.none, false],
        ['lightworld_deathmountain_west', 'old_man', inventory('flute lamp'), true],
        ['lightworld_deathmountain_west', 'old_man', inventory('flute'), 'dark'],
        ['lightworld_deathmountain_west', 'old_man', inventory('glove lamp'), true],
        ['lightworld_deathmountain_west', 'old_man', inventory('glove'), 'dark'],
        ['lightworld_deathmountain_east', 'island_dm', inventory.none, false],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute hammer mitt moonpearl mirror'), true],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute hookshot mitt moonpearl mirror'), true],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute mirror hammer'), 'viewable'],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute hookshot'), 'viewable'],
        ['lightworld_deathmountain_east', 'island_dm', inventory('lamp hammer mitt moonpearl mirror'), true],
        ['lightworld_deathmountain_east', 'island_dm', inventory('lamp hookshot mitt moonpearl mirror'), true],
        ['lightworld_deathmountain_east', 'island_dm', inventory('glove mirror hammer'), 'viewable'],
        ['lightworld_deathmountain_east', 'island_dm', inventory('glove hookshot'), 'viewable'],
        ['lightworld_deathmountain_east', 'island_dm', inventory('hammer mitt moonpearl mirror'), 'dark'],
        ['lightworld_deathmountain_east', 'island_dm', inventory('hookshot mitt moonpearl mirror'), 'dark'],
        ['lightworld_deathmountain_east', 'spiral', inventory.none, false],
        ['lightworld_deathmountain_east', 'spiral', inventory('flute hammer mirror'), true],
        ['lightworld_deathmountain_east', 'spiral', inventory('flute hookshot'), true],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove lamp hammer mirror'), true],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove lamp hookshot'), true],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove hammer mirror'), 'dark'],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove hookshot'), 'dark'],
        ['lightworld_deathmountain_east', 'paradox', inventory.none, false],
        ['lightworld_deathmountain_east', 'paradox', inventory('flute hammer mirror'), true],
        ['lightworld_deathmountain_east', 'paradox', inventory('flute hookshot'), true],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove lamp hammer mirror'), true],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove lamp hookshot'), true],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove hammer mirror'), 'dark'],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove hookshot'), 'dark'],
        ['lightworld_deathmountain_east', 'mimic', inventory.none, false],
        ['lightworld_northwest', 'altar', inventory.none, false],
        ['lightworld_northwest', 'mushroom', inventory.none, true],
        ['lightworld_northwest', 'hideout', inventory.none, true],
        ['lightworld_northwest', 'tree', inventory.none, 'viewable'],
        ['lightworld_northwest', 'graveyard_w', inventory.none, false],
        ['lightworld_northwest', 'graveyard_w', inventory('boots'), true],
        ['lightworld_northwest', 'graveyard_n', inventory.none, false],
        ['lightworld_northwest', 'graveyard_e', inventory.none, false],
        ['lightworld_northwest', 'well', inventory.none, true],
        ['lightworld_northwest', 'thief_hut', inventory.none, true],
        ['lightworld_northwest', 'bottle', inventory.none, true],
        ['lightworld_northwest', 'chicken', inventory.none, true],
        ['lightworld_northwest', 'kid', inventory.none, false],
        ['lightworld_northwest', 'kid', inventory('bottle'), true],
        ['lightworld_northwest', 'tavern', inventory.none, true],
        ['lightworld_northwest', 'frog', inventory.none, false],
        ['lightworld_northwest', 'bat', inventory.none, false],
        ['lightworld_northeast', 'zora', inventory.none, false],
        ['lightworld_northeast', 'zora', inventory('flippers'), true],
        ['lightworld_northeast', 'zora', inventory('glove'), true],
        ['lightworld_northeast', 'river', inventory.none, false],
        ['lightworld_northeast', 'river', inventory('flippers'), true],
        ['lightworld_northeast', 'river', inventory('glove'), 'viewable'],
        ['lightworld_northeast', 'fairy_lw', inventory.none, false],
        ['lightworld_northeast', 'fairy_lw', inventory('flippers'), true],
        ['lightworld_northeast', 'witch', inventory.none, false],
        ['lightworld_northeast', 'witch', inventory('mushroom'), true],
        ['lightworld_northeast', 'sahasrahla_hut', inventory.none, true],
        ['lightworld_northeast', 'sahasrahla', inventory.none, false],
        ['lightworld_south', 'maze', inventory.none, true],
        ['lightworld_south', 'library', inventory.none, 'viewable'],
        ['lightworld_south', 'library', inventory('boots'), true],
        ['lightworld_south', 'grove_n', inventory.none, false],
        ['lightworld_south', 'grove_n', inventory('shovel'), true],
        ['lightworld_south', 'grove_s', inventory.none, false],
        ['lightworld_south', 'link_house', inventory.none, true],
        ['lightworld_south', 'desert_w', inventory.none, 'viewable'],
        ['lightworld_south', 'desert_ne', inventory.none, false],
        ['lightworld_south', 'aginah', inventory.none, true],
        ['lightworld_south', 'bombos', inventory.none, false],
        ['lightworld_south', 'dam', inventory.none, true],
        ['lightworld_south', 'lake_sw', inventory.none, true],
        ['lightworld_south', 'island_lake', inventory.none, 'viewable'],
        ['lightworld_south', 'hobo', inventory.none, false],
        ['lightworld_south', 'hobo', inventory('flippers'), true],
        ['lightworld_south', 'ice_cave', inventory.none, true],
        (region, name, inventory, state) => it(`shows ${region} - ${name} ${as(state)} ${inventory}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.lightworld[name].should.equal(state);
        }));

    });

    context('darkworld locations', () => {

        with_cases(
        ['darkworld_deathmountain_west', 'spike', inventory.none, false],
        ['darkworld_deathmountain_east', 'rock_hook', inventory.none, false],
        ['darkworld_deathmountain_east', 'rock_boots', inventory.none, false],
        ['darkworld_deathmountain_east', 'bunny', inventory.none, false],
        ['darkworld_northwest', 'bumper', inventory.none, false],
        ['darkworld_northwest', 'chest_game', inventory.none, false],
        ['darkworld_northwest', 'c_house', inventory.none, false],
        ['darkworld_northwest', 'bomb_hut', inventory.none, false],
        ['darkworld_northwest', 'purple', inventory.none, false],
        ['darkworld_northwest', 'pegs', inventory.none, false],
        ['darkworld_northeast', 'catfish', inventory.none, false],
        ['darkworld_northeast', 'pyramid', inventory.none, false],
        ['darkworld_northeast', 'fairy_dw', inventory.none, false],
        ['darkworld_south', 'dig_game', inventory.none, false],
        ['darkworld_south', 'stumpy', inventory.none, false],
        ['darkworld_south', 'swamp_ne', inventory.none, false],
        ['darkworld_mire', 'mire_w', inventory.none, false],
        (region, name, inventory, state) => it(`shows ${region} - ${name} ${as(state)} ${inventory}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.darkworld[name].should.equal(state);
        }));

    });

});
