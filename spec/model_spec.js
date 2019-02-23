const _ = require('lodash');

const with_cases = require('./spec_helper').with_cases;

const chai = require('chai');
const expect = chai.expect;
chai.should();

const create_model = require('../src/model');

const dungeon = ({ opened = 0, medallion = 0, keys = 0, big_key }) => {
    return {
        update(model, region) {
            _.times(opened, () => model.lower_chest(region));
            _.times(medallion, () => model.raise_medallion(region));
            _.times(keys, () => model.raise_key(region));
            big_key && model.toggle_big_key(region);
        },
        toString() {
            const parts = _.compact([
                medallion && `medallion ${medallion}`,
                opened && `${opened} opened chests`,
                keys && `${keys} small keys`,
                big_key && 'big key'
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
                sword: ['sword', 1],
                mastersword: ['sword', 2],
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

const each_dungeon = [
    'eastern', 'desert', 'hera', 'darkness', 'swamp',
    'skull', 'thieves', 'ice', 'mire', 'turtle'
];

describe('Model', () => {

    let model;

    beforeEach(() => {
        model = create_model({ open: true });
    });

    it('can level items', () => {
        model.lower_item('tunic');
        model.lower_item('bow');
        model.state().items.should.include({ tunic: 3, bow: 3 });

        model.raise_item('tunic');
        model.raise_item('bow');
        model.state().items.should.include({ tunic: 1, bow: 0 });
    });

    with_cases(...each_dungeon,
    (dungeon) => it(`show completable as marked for ${dungeon} when completed`, () => {
        model.toggle_completion(dungeon);
        model.state().dungeons[dungeon].completable.should.equal('marked');
    }));

    it('can level dungeon chests', () => {
        model.raise_chest('eastern');
        model.state().dungeons.eastern.chests.should.equal(0);

        model.lower_chest('eastern');
        model.state().dungeons.eastern.chests.should.equal(3);
    });

    with_cases({
        eastern: 3, desert: 2, hera: 2, darkness: 5, swamp: 6,
        skull: 2, thieves: 4, ice: 3, mire: 2, turtle: 5
    }, (dungeon, chests) => it(`${dungeon} should start out with ${chests} chests`, () => {
        model.state().dungeons[dungeon].chests.should.equal(chests);
    }));

    with_cases(...each_dungeon,
    (dungeon) => it(`show progressable as marked for ${dungeon} when all chests are opened`, () => {
        model.raise_chest(dungeon);
        model.state().dungeons[dungeon].progressable.should.equal('marked');
    }));

    it('can cycle dungeon prizes', () => {
        model.lower_prize('eastern');
        model.state().dungeons.eastern.prize.should.equal('crystal-red');

        const prizes = [];
        _.times(5, () => {
            model.raise_prize('eastern');
            prizes.push(model.state().dungeons.eastern.prize);
        });
        prizes.should.deep.equal(['unknown', 'pendant-green', 'pendant', 'crystal', 'crystal-red']);
    });

    it('can cycle dungeon medallions', () => {
        model.lower_medallion('mire');
        model.state().dungeons.mire.medallion.should.equal('quake');

        const prizes = [];
        _.times(4, () => {
            model.raise_medallion('mire');
            prizes.push(model.state().dungeons.mire.medallion);
        });
        prizes.should.deep.equal(['unknown', 'bombos', 'ether', 'quake']);
    });

    with_cases({
        lightworld_deathmountain_west: 'ether',
        lightworld_deathmountain_east: 'island_dm',
        lightworld_northwest: 'altar',
        lightworld_northeast: 'zora',
        lightworld_south: 'maze',
        castle_escape: 'sanctuary'
    }, (region, name) => it(`can mark ${region} locations`, () => {
        model.toggle_overworld_mark(region, name);
        const actual = model.state();
        actual.lightworld[name].should.equal('marked');
    }));

    with_cases({
        darkworld_deathmountain_west: 'spike',
        darkworld_deathmountain_east: 'rock_hook',
        darkworld_northwest: 'bumper',
        darkworld_northeast: 'catfish',
        darkworld_south: 'dig_game',
        darkworld_mire: 'mire_w'
    }, (region, name) => it(`can mark ${region} locations`, () => {
        model.toggle_overworld_mark(region, name);
        const actual = model.state();
        actual.darkworld[name].should.equal('marked');
    }));

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

            it('uses region access logic for completable', () => {
                inventory('glove lamp sword boots').update(model);
                const actual = model.state();
                actual.dungeons.desert.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('book glove lamp sword'), 'possible'],
            [inventory('book glove lamp hammer'), 'possible'],
            [inventory('book glove lamp bow'), 'possible'],
            [inventory('book glove lamp icerod'), 'possible'],
            [inventory('book glove lamp somaria'), 'possible'],
            [inventory('book glove lamp byrna'), 'possible'],
            [inventory('book glove firerod'), 'possible'],
            [inventory('book glove lamp sword boots'), true],
            [inventory('book glove lamp hammer boots'), true],
            [inventory('book glove lamp bow boots'), true],
            [inventory('book glove lamp icerod boots'), true],
            [inventory('book glove lamp somaria boots'), true],
            [inventory('book glove lamp byrna boots'), true],
            [inventory('book glove firerod boots'), true],
            [inventory('mirror mitt flute lamp sword'), 'possible'],
            [inventory('mirror mitt flute lamp hammer'), 'possible'],
            [inventory('mirror mitt flute lamp bow'), 'possible'],
            [inventory('mirror mitt flute lamp icerod'), 'possible'],
            [inventory('mirror mitt flute lamp somaria'), 'possible'],
            [inventory('mirror mitt flute lamp byrna'), 'possible'],
            [inventory('mirror mitt flute firerod'), 'possible'],
            [inventory('mirror mitt flute lamp sword boots'), true],
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

            it('uses region access logic for progressable', () => {
                dungeon.initial, inventory('boots').update(model);
                const actual = model.state();
                actual.dungeons.desert.progressable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
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

            it('uses region access logic for completable', () => {
                inventory('sword firerod').update(model);
                const actual = model.state();
                actual.dungeons.hera.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('mirror flute sword firerod'), true],
            [inventory('mirror flute hammer firerod'), true],
            [inventory('mirror flute sword lamp'), true],
            [inventory('mirror flute hammer lamp'), true],
            [inventory('mirror flute sword'), 'possible'],
            [inventory('mirror flute hammer'), 'possible'],
            [inventory('mirror glove lamp sword'), true],
            [inventory('mirror glove lamp hammer'), true],
            [inventory('hookshot hammer flute firerod'), true],
            [inventory('hookshot hammer flute lamp'), true],
            [inventory('hookshot hammer flute'), 'possible'],
            [inventory('hookshot hammer glove lamp'), true],
            [inventory('mirror glove sword'), 'possible'],
            [inventory('mirror glove hammer'), 'possible'],
            [inventory('mirror glove sword firerod'), 'dark'],
            [inventory('mirror glove hammer firerod'), 'dark'],
            [inventory('hookshot hammer glove'), 'possible'],
            [inventory('hookshot hammer glove firerod'), 'dark'],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.hera.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('firerod').update(model);
                const actual = model.state();
                actual.dungeons.hera.progressable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
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

            it('uses region access logic for completable', () => {
                inventory('bow hammer lamp').update(model);
                const actual = model.state();
                actual.dungeons.darkness.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('moonpearl glove hammer bow lamp'), true],
            [inventory('moonpearl glove hammer bow'), 'dark'],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.darkness.completable.should.equal(state);
            }));

            with_cases(
            [inventory('moonpearl bow hammer lamp'), true],
            [inventory('moonpearl bow hammer'), 'dark'],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.darkness.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('bow lamp').update(model);
                const actual = model.state();
                actual.dungeons.darkness.progressable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl glove hammer bow lamp'), true],
            [dungeon.initial, inventory('moonpearl glove hammer'), 'possible'],
            [dungeon({ opened: 4 }), inventory('moonpearl mitt flippers bow lamp hammer'), true],
            [dungeon({ opened: 4 }), inventory('moonpearl mitt flippers bow lamp'), 'possible'],
            [dungeon.initial, inventory('moonpearl mitt flippers'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'darkness');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.darkness.progressable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory('moonpearl bow lamp'), true],
            [dungeon.initial, inventory('moonpearl'), 'possible'],
            [dungeon({ opened: 4 }), inventory('moonpearl bow lamp hammer'), true],
            [dungeon({ opened: 4 }), inventory('moonpearl bow lamp'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                dungeon.update(model, 'darkness');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.darkness.progressable.should.equal(state);
            }));

        });

        context('swamp palace', () => {

            it('uses region access logic for completable', () => {
                inventory('hammer hookshot').update(model);
                const actual = model.state();
                actual.dungeons.swamp.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('moonpearl mirror flippers glove hammer hookshot'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.swamp.completable.should.equal(state);
            }));

            with_cases(
            [inventory('moonpearl mirror flippers hammer hookshot'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.swamp.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('hammer').update(model);
                const actual = model.state();
                actual.dungeons.swamp.progressable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl mirror flippers glove hammer'), true],
            [dungeon.initial, inventory('moonpearl mirror flippers mitt'), 'possible'],
            [dungeon({ opened: 1 }), inventory('moonpearl mirror flippers glove hammer'), true],
            [dungeon({ opened: 2 }), inventory('moonpearl mirror flippers glove hammer hookshot'), true],
            [dungeon({ opened: 2 }), inventory('moonpearl mirror flippers glove hammer'), 'possible'],
            [dungeon({ opened: 4 }), inventory('moonpearl mirror flippers glove hammer hookshot'), true],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'swamp');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.swamp.progressable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory('moonpearl mirror flippers hammer'), true],
            [dungeon.initial, inventory('moonpearl mirror flippers hookshot'), 'possible'],
            [dungeon({ opened: 1 }), inventory('moonpearl mirror flippers hammer'), true],
            [dungeon({ opened: 2 }), inventory('moonpearl mirror flippers hammer hookshot'), true],
            [dungeon({ opened: 2 }), inventory('moonpearl mirror flippers hammer'), 'possible'],
            [dungeon({ opened: 4 }), inventory('moonpearl mirror flippers hammer hookshot'), true],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                dungeon.update(model, 'swamp');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.swamp.progressable.should.equal(state);
            }));

        });

        context('skull woods', () => {

            it('uses region access logic for completable', () => {
                inventory('firerod sword').update(model);
                const actual = model.state();
                actual.dungeons.skull.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('moonpearl glove hammer firerod sword'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.skull.completable.should.equal(state);
            }));

            with_cases(
            [inventory('moonpearl hookshot flippers firerod sword'), true],
            [inventory('moonpearl hookshot glove firerod sword'), true],
            [inventory('moonpearl hookshot hammer firerod sword'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.skull.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('firerod').update(model);
                const actual = model.state();
                actual.dungeons.skull.progressable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl glove hammer firerod'), true],
            [dungeon.initial, inventory('moonpearl mitt firerod'), true],
            [dungeon({ opened: 1 }), inventory('moonpearl glove hammer firerod sword'), true],
            [dungeon({ opened: 1 }), inventory('moonpearl mitt firerod sword'), true],
            [dungeon({ opened: 1 }), inventory('moonpearl glove hammer'), 'possible'],
            [dungeon({ opened: 1 }), inventory('moonpearl mitt'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'skull');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.skull.progressable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory('moonpearl hookshot flippers firerod'), true],
            [dungeon.initial, inventory('moonpearl hookshot glove firerod'), true],
            [dungeon.initial, inventory('moonpearl hookshot hammer firerod'), true],
            [dungeon({ opened: 1 }), inventory('moonpearl hookshot flippers firerod sword'), true],
            [dungeon({ opened: 1 }), inventory('moonpearl hookshot glove firerod sword'), true],
            [dungeon({ opened: 1 }), inventory('moonpearl hookshot hammer firerod sword'), true],
            [dungeon({ opened: 1 }), inventory('moonpearl hookshot flippers'), 'possible'],
            [dungeon({ opened: 1 }), inventory('moonpearl hookshot glove'), 'possible'],
            [dungeon({ opened: 1 }), inventory('moonpearl hookshot hammer'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                dungeon.update(model, 'skull');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.skull.progressable.should.equal(state);
            }));

        });

        context("thieves' town", () => {

            it('uses region access logic for completable', () => {
                inventory('sword').update(model);
                const actual = model.state();
                actual.dungeons.thieves.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('moonpearl glove hammer'), true],
            [inventory('moonpearl mitt sword'), true],
            [inventory('moonpearl mitt somaria'), true],
            [inventory('moonpearl mitt byrna'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.thieves.completable.should.equal(state);
            }));

            with_cases(
            [inventory('moonpearl hookshot flippers sword'), true],
            [inventory('moonpearl hookshot flippers somaria'), true],
            [inventory('moonpearl hookshot flippers byrna'), true],
            [inventory('moonpearl hookshot glove sword'), true],
            [inventory('moonpearl hookshot glove somaria'), true],
            [inventory('moonpearl hookshot glove byrna'), true],
            [inventory('moonpearl hookshot hammer'), true],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.thieves.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('hammer').update(model);
                const actual = model.state();
                actual.dungeons.thieves.progressable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl glove hammer'), true],
            [dungeon.initial, inventory('moonpearl mitt'), true],
            [dungeon({ opened: 3 }), inventory('moonpearl glove hammer'), true],
            [dungeon({ opened: 3 }), inventory('moonpearl mitt'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'thieves');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.thieves.progressable.should.equal(state);
            }));

            with_cases(
            [dungeon.initial, inventory('moonpearl hookshot flippers'), true],
            [dungeon.initial, inventory('moonpearl hookshot glove'), true],
            [dungeon.initial, inventory('moonpearl hookshot hammer'), true],
            [dungeon({ opened: 3 }), inventory('moonpearl hookshot flippers'), 'possible'],
            [dungeon({ opened: 3 }), inventory('moonpearl hookshot glove'), 'possible'],
            [dungeon({ opened: 3 }), inventory('moonpearl hookshot hammer'), true],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                model.toggle_completion('castle_tower');
                dungeon.update(model, 'thieves');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.thieves.progressable.should.equal(state);
            }));

        });

        context('ice palace', () => {

            it('uses region access logic for completable', () => {
                inventory('hammer somaria').update(model);
                const actual = model.state();
                actual.dungeons.ice.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('moonpearl flippers mitt firerod hammer somaria'), true],
            [inventory('moonpearl flippers mitt firerod hammer hookshot'), true],
            [inventory('moonpearl flippers mitt firerod hammer'), 'possible'],
            [inventory('moonpearl flippers mitt bombos sword hammer somaria'), true],
            [inventory('moonpearl flippers mitt bombos sword hammer hookshot'), true],
            [inventory('moonpearl flippers mitt bombos sword hammer'), 'possible'],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.ice.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('hammer').update(model);
                const actual = model.state();
                actual.dungeons.ice.progressable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('moonpearl flippers mitt firerod hammer'), true],
            [inventory('moonpearl flippers mitt firerod'), 'possible'],
            [inventory('moonpearl flippers mitt bombos sword hammer'), true],
            [inventory('moonpearl flippers mitt bombos sword'), 'possible'],
            (inventory, state) => it(`shows progressable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.ice.progressable.should.equal(state);
            }));

        });

        context('misery mire', () => {

            it('uses region access logic for completable', () => {
                inventory('somaria bombos ether quake lamp').update(model);
                const actual = model.state();
                actual.dungeons.mire.completable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl boots sword flute mitt somaria bombos ether quake lamp'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt somaria bombos lamp'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt somaria ether lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt somaria quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt somaria quake firerod'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt somaria quake'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot sword flute mitt somaria quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot sword flute mitt somaria quake firerod'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot sword flute mitt somaria quake'), 'possible'],
            (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'mire');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.mire.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('bombos ether quake firerod').update(model);
                const actual = model.state();
                actual.dungeons.mire.progressable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl boots sword flute mitt bombos ether quake firerod'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt bombos firerod'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt ether firerod'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt quake firerod'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt quake'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot sword flute mitt quake firerod'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot sword flute mitt quake lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl hookshot sword flute mitt quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl boots sword flute mitt quake lamp somaria'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl boots sword flute mitt quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl hookshot sword flute mitt quake lamp somaria'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl hookshot sword flute mitt quake'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'mire');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.mire.progressable.should.equal(state);
            }));

        });

        context('turtle rock', () => {

            it('uses region access logic for completable', () => {
                inventory('icerod firerod bombos ether quake byrna lamp').update(model);
                const actual = model.state();
                actual.dungeons.turtle.completable.should.equal(false);
            });
            
            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl mitt hammer somaria sword mirror icerod firerod bombos ether quake byrna lamp'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod bombos byrna lamp'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod ether byrna lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod quake byrna lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod quake byrna'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod quake cape lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod quake cape'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod quake mirrorshield lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod quake mirrorshield'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror icerod firerod quake'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot icerod firerod quake byrna lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot icerod firerod quake byrna'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot icerod firerod quake cape lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot icerod firerod quake cape'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot icerod firerod quake mirrorshield lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot icerod firerod quake mirrorshield'), 'dark'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot icerod firerod quake'), 'possible'],
            (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'turtle');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.turtle.completable.should.equal(state);
            }));

            it('uses region access logic for progressable', () => {
                inventory('bombos ether quake firerod lamp').update(model);
                const actual = model.state();
                actual.dungeons.turtle.progressable.should.equal(false);
            });

            with_cases(
            [dungeon.initial, inventory.none, false],
            [dungeon.initial, inventory('moonpearl mitt hammer somaria sword mirror bombos ether quake firerod lamp'), true],
            [dungeon({ medallion: 1 }), inventory('moonpearl mitt hammer somaria sword mirror bombos firerod lamp'), true],
            [dungeon({ medallion: 2 }), inventory('moonpearl mitt hammer somaria sword mirror ether firerod lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake firerod lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword mirror quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake firerod lamp'), true],
            [dungeon({ medallion: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 1 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 3 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake byrna'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake cape'), 'possible'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield icerod firerod lamp'), true],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield icerod firerod'), 'dark'],
            [dungeon({ medallion: 3, opened: 4 }), inventory('moonpearl mitt hammer somaria sword hookshot quake mirrorshield'), 'possible'],
            (dungeon, inventory, state) => it(`show progressable ${as(state)} for ${dungeon} ${inventory}`, () => {
                dungeon.update(model, 'turtle');
                inventory.update(model);
                const actual = model.state();
                actual.dungeons.turtle.progressable.should.equal(state);
            }));

        });

    });

    context('encounters', () => {

        context('castle tower', () => {

            it('uses region access logic for completable', () => {
                inventory('sword lamp').update(model);
                const actual = model.state();
                actual.encounters.castle_tower.completable.should.equal(false);
            });

            with_cases(
            [inventory.none, false],
            [inventory('cape sword lamp'), true],
            [inventory('cape sword'), 'dark'],
            [inventory('mastersword lamp'), true],
            [inventory('mastersword'), 'dark'],
            (inventory, state) => it(`show completable ${as(state)} ${inventory}`, () => {
                inventory.update(model);
                const actual = model.state();
                actual.encounters.castle_tower.completable.should.equal(state);
            }));

        });

    });

    context('lightworld locations', () => {

        with_cases(
        ['lightworld_deathmountain_west', 'ether', inventory.none, false],
        ['lightworld_deathmountain_west', 'ether', inventory('flute book mirror mastersword'), true],
        ['lightworld_deathmountain_west', 'ether', inventory('flute book hammer hookshot mastersword'), true],
        ['lightworld_deathmountain_west', 'ether', inventory('flute book mirror'), 'viewable'],
        ['lightworld_deathmountain_west', 'ether', inventory('flute book hammer hookshot'), 'viewable'],
        ['lightworld_deathmountain_west', 'ether', inventory('glove lamp book mirror mastersword'), true],
        ['lightworld_deathmountain_west', 'ether', inventory('glove lamp book hammer hookshot mastersword'), true],
        ['lightworld_deathmountain_west', 'ether', inventory('glove lamp book mirror'), 'viewable'],
        ['lightworld_deathmountain_west', 'ether', inventory('glove lamp book hammer hookshot'), 'viewable'],
        ['lightworld_deathmountain_west', 'ether', inventory('glove book mirror mastersword'), 'dark'],
        ['lightworld_deathmountain_west', 'ether', inventory('glove book hammer hookshot mastersword'), 'dark'],
        ['lightworld_deathmountain_west', 'ether', inventory('glove book mirror'), 'viewable'],
        ['lightworld_deathmountain_west', 'ether', inventory('glove book hammer hookshot'), 'viewable'],
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
        ['lightworld_northwest', 'altar', inventory('book'), 'viewable'],
        ['lightworld_northwest', 'mushroom', inventory.none, true],
        ['lightworld_northwest', 'hideout', inventory.none, true],
        ['lightworld_northwest', 'tree', inventory.none, 'viewable'],
        ['lightworld_northwest', 'graveyard_w', inventory.none, false],
        ['lightworld_northwest', 'graveyard_w', inventory('boots'), true],
        ['lightworld_northwest', 'graveyard_n', inventory.none, false],
        ['lightworld_northwest', 'graveyard_n', inventory('mirror moonpearl glove hammer'), true],
        ['lightworld_northwest', 'graveyard_n', inventory('mirror moonpearl mitt'), true],
        ['lightworld_northwest', 'graveyard_e', inventory.none, false],
        ['lightworld_northwest', 'graveyard_e', inventory('boots mitt'), true],
        ['lightworld_northwest', 'graveyard_e', inventory('boots mirror moonpearl glove hammer'), true],
        ['lightworld_northwest', 'well', inventory.none, true],
        ['lightworld_northwest', 'thief_hut', inventory.none, true],
        ['lightworld_northwest', 'bottle', inventory.none, true],
        ['lightworld_northwest', 'chicken', inventory.none, true],
        ['lightworld_northwest', 'kid', inventory.none, false],
        ['lightworld_northwest', 'kid', inventory('bottle'), true],
        ['lightworld_northwest', 'tavern', inventory.none, true],
        ['lightworld_northwest', 'frog', inventory.none, false],
        ['lightworld_northwest', 'frog', inventory('moonpearl mitt'), true],
        ['lightworld_northwest', 'bat', inventory.none, false],
        ['lightworld_northwest', 'bat', inventory('powder moonpearl mirror mitt'), true],
        ['lightworld_northwest', 'bat', inventory('powder hammer'), true],
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
        ['lightworld_south', 'grove_s', inventory('mirror moonpearl glove hammer'), true],
        ['lightworld_south', 'grove_s', inventory('mirror moonpearl mitt'), true],
        ['lightworld_south', 'link_house', inventory.none, true],
        ['lightworld_south', 'desert_w', inventory.none, 'viewable'],
        ['lightworld_south', 'desert_w', inventory('book'), true],
        ['lightworld_south', 'desert_w', inventory('mirror mitt flute'), true],
        ['lightworld_south', 'desert_ne', inventory.none, false],
        ['lightworld_south', 'desert_ne', inventory('flute mitt mirror'), true],
        ['lightworld_south', 'aginah', inventory.none, true],
        ['lightworld_south', 'bombos', inventory.none, false],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl glove hammer mastersword'), true],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl glove hammer'), 'viewable'],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl mitt mastersword'), true],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl mitt'), 'viewable'],
        ['lightworld_south', 'dam', inventory.none, true],
        ['lightworld_south', 'lake_sw', inventory.none, true],
        ['lightworld_south', 'island_lake', inventory.none, 'viewable'],
        ['lightworld_south', 'island_lake', inventory('flippers moonpearl mirror glove hammer'), true],
        ['lightworld_south', 'island_lake', inventory('flippers moonpearl mirror mitt'), true],
        ['lightworld_south', 'hobo', inventory.none, false],
        ['lightworld_south', 'hobo', inventory('flippers'), true],
        ['lightworld_south', 'ice_cave', inventory.none, true],
        ['castle_escape', 'sanctuary', inventory.none, true],
        ['castle_escape', 'escape_side', inventory.none, 'dark'],
        ['castle_escape', 'escape_side', inventory('glove'), true],
        ['castle_escape', 'escape_side', inventory('lamp'), 'possible'],
        ['castle_escape', 'escape_dark', inventory.none, 'dark'],
        ['castle_escape', 'escape_dark', inventory('lamp'), true],
        ['castle_escape', 'castle', inventory.none, true],
        ['castle_escape', 'secret', inventory.none, true],
        (region, name, inventory, state) => it(`shows ${region} - ${name} ${as(state)} ${inventory}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.lightworld[name].should.equal(state);
        }));

        with_cases(
        ['lightworld_northwest', 'tree', inventory('boots'), true],
        ['lightworld_northwest', 'graveyard_n', inventory('mirror moonpearl hookshot flippers'), true],
        ['lightworld_northwest', 'graveyard_n', inventory('mirror moonpearl hookshot glove'), true],
        ['lightworld_northwest', 'graveyard_n', inventory('mirror moonpearl hookshot hammer'), true],
        ['lightworld_northwest', 'graveyard_e', inventory('boots mirror moonpearl hookshot flippers'), true],
        ['lightworld_northwest', 'graveyard_e', inventory('boots mirror moonpearl hookshot glove'), true],
        ['lightworld_northwest', 'graveyard_e', inventory('boots mirror moonpearl hookshot hammer'), true],
        ['lightworld_south', 'grove_s', inventory('mirror moonpearl hammer'), true],
        ['lightworld_south', 'grove_s', inventory('mirror moonpearl hookshot glove'), true],
        ['lightworld_south', 'grove_s', inventory('mirror moonpearl hookshot flippers'), true],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl hammer mastersword'), true],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl hammer'), 'viewable'],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl hookshot glove mastersword'), true],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl hookshot glove'), 'viewable'],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl hookshot flippers mastersword'), true],
        ['lightworld_south', 'bombos', inventory('book mirror moonpearl hookshot flippers'), 'viewable'],
        ['lightworld_south', 'island_lake', inventory('flippers moonpearl mirror hammer'), true],
        ['lightworld_south', 'island_lake', inventory('flippers moonpearl mirror hookshot'), true],
        (region, name, inventory, state) => it(`shows ${region} - ${name} ${as(state)} ${inventory}, and agahnim defeated`, () => {
            model.toggle_completion('castle_tower');
            inventory.update(model);
            const actual = model.state();
            actual.lightworld[name].should.equal(state);
        }));

        with_cases(
        [inventory('flute moonpearl mitt hammer somaria sword mirror quake firerod'), true],
        [inventory('flute moonpearl mitt hammer somaria sword mirror quake'), 'possible'],
        [inventory('lamp moonpearl mitt hammer somaria sword mirror quake firerod'), true],
        [inventory('lamp moonpearl mitt hammer somaria sword mirror quake'), 'possible'],
        [inventory('moonpearl mitt hammer somaria sword mirror quake firerod'), 'dark'],
        [inventory('moonpearl mitt hammer somaria sword mirror quake'), 'possible'],
        (inventory, state) => it(`shows lightworld_deathmountain_east - mimic ${as(state)} ${inventory}`, () => {
            _.times(3, () => model.raise_medallion('turtle'));
            inventory.update(model);
            const actual = model.state();
            actual.lightworld.mimic.should.equal(state);
        }));

        it('shows lightworld_northwest - altar as available when three pendants have been acquired', () => {
            model.toggle_completion('eastern');
            model.toggle_completion('desert');
            model.toggle_completion('hera');
            _.times(1, () => model.raise_prize('eastern'));
            _.times(2, () => model.raise_prize('desert'));
            _.times(2, () => model.raise_prize('hera'));
            const actual = model.state();
            actual.lightworld.altar.should.be.true;
        });

        it('shows lightworld_northeast - sahasrahla as available when the green pendant have been acquired', () => {
            model.toggle_completion('eastern');
            _.times(1, () => model.raise_prize('eastern'));
            const actual = model.state();
            actual.lightworld.sahasrahla.should.be.true;
        });

    });

    context('darkworld locations', () => {

        with_cases(
        ['darkworld_mire', 'mire_w', inventory('moonpearl'), false],
        (region, name, inventory, state) => it(`uses region access logic for locations in ${region}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.darkworld[name].should.equal(state);
        }));

        with_cases(
        ['darkworld_deathmountain_west', 'spike', inventory.none, false],
        ['darkworld_deathmountain_west', 'spike', inventory('flute moonpearl hammer glove cape'), true],
        ['darkworld_deathmountain_west', 'spike', inventory('flute moonpearl hammer glove byrna'), true],
        ['darkworld_deathmountain_west', 'spike', inventory('lamp moonpearl hammer glove cape'), true],
        ['darkworld_deathmountain_west', 'spike', inventory('lamp moonpearl hammer glove byrna'), true],
        ['darkworld_deathmountain_west', 'spike', inventory('moonpearl hammer glove cape'), 'dark'],
        ['darkworld_deathmountain_west', 'spike', inventory('moonpearl hammer glove byrna'), 'dark'],
        ['darkworld_deathmountain_east', 'rock_hook', inventory.none, false],
        ['darkworld_deathmountain_east', 'rock_hook', inventory('flute mitt moonpearl hookshot'), true],
        ['darkworld_deathmountain_east', 'rock_hook', inventory('lamp mitt moonpearl hookshot'), true],
        ['darkworld_deathmountain_east', 'rock_hook', inventory('mitt moonpearl hookshot'), 'dark'],
        ['darkworld_deathmountain_east', 'rock_boots', inventory.none, false],
        ['darkworld_deathmountain_east', 'rock_boots', inventory('flute mitt moonpearl hookshot'), true],
        ['darkworld_deathmountain_east', 'rock_boots', inventory('flute mirror hammer mitt moonpearl boots'), true],
        ['darkworld_deathmountain_east', 'rock_boots', inventory('lamp mitt moonpearl hookshot'), true],
        ['darkworld_deathmountain_east', 'rock_boots', inventory('lamp mirror hammer mitt moonpearl boots'), true],
        ['darkworld_deathmountain_east', 'rock_boots', inventory('mitt moonpearl hookshot'), 'dark'],
        ['darkworld_deathmountain_east', 'rock_boots', inventory('mirror hammer mitt moonpearl boots'), 'dark'],
        ['darkworld_deathmountain_east', 'bunny', inventory.none, false],
        ['darkworld_deathmountain_east', 'bunny', inventory('flute mirror hammer mitt moonpearl'), true],
        ['darkworld_deathmountain_east', 'bunny', inventory('flute hookshot mitt moonpearl'), true],
        ['darkworld_deathmountain_east', 'bunny', inventory('lamp mirror hammer mitt moonpearl'), true],
        ['darkworld_deathmountain_east', 'bunny', inventory('lamp hookshot mitt moonpearl'), true],
        ['darkworld_deathmountain_east', 'bunny', inventory('mirror hammer mitt moonpearl'), 'dark'],
        ['darkworld_deathmountain_east', 'bunny', inventory('hookshot mitt moonpearl'), 'dark'],
        ['darkworld_northwest', 'bumper', inventory.none, false],
        ['darkworld_northwest', 'bumper', inventory('moonpearl hammer glove cape'), true],
        ['darkworld_northwest', 'bumper', inventory('moonpearl mitt cape'), true],
        ['darkworld_northwest', 'bumper', inventory('moonpearl glove hammer'), 'viewable'],
        ['darkworld_northwest', 'bumper', inventory('moonpearl mitt'), 'viewable'],
        ['darkworld_northwest', 'chest_game', inventory.none, false],
        ['darkworld_northwest', 'chest_game', inventory('moonpearl glove hammer'), true],
        ['darkworld_northwest', 'chest_game', inventory('moonpearl mitt'), true],
        ['darkworld_northwest', 'c_house', inventory.none, false],
        ['darkworld_northwest', 'c_house', inventory('moonpearl glove hammer'), true],
        ['darkworld_northwest', 'c_house', inventory('moonpearl mitt'), true],
        ['darkworld_northwest', 'bomb_hut', inventory.none, false],
        ['darkworld_northwest', 'bomb_hut', inventory('moonpearl glove hammer'), true],
        ['darkworld_northwest', 'bomb_hut', inventory('moonpearl mitt'), true],
        ['darkworld_northwest', 'purple', inventory.none, false],
        ['darkworld_northwest', 'purple', inventory('moonpearl mitt'), true],
        ['darkworld_northwest', 'pegs', inventory.none, false],
        ['darkworld_northwest', 'pegs', inventory('moonpearl mitt hammer'), true],
        ['darkworld_northeast', 'catfish', inventory.none, false],
        ['darkworld_northeast', 'catfish', inventory('hammer moonpearl glove'), true],
        ['darkworld_northeast', 'catfish', inventory('mitt flippers moonpearl'), true],
        ['darkworld_northeast', 'pyramid', inventory.none, false],
        ['darkworld_northeast', 'pyramid', inventory('moonpearl glove hammer'), true],
        ['darkworld_northeast', 'pyramid', inventory('moonpearl mitt flippers'), true],
        ['darkworld_northeast', 'fairy_dw', inventory.none, false],
        ['darkworld_south', 'dig_game', inventory.none, false],
        ['darkworld_south', 'dig_game', inventory('moonpearl glove hammer'), true],
        ['darkworld_south', 'dig_game', inventory('moonpearl mitt'), true],
        ['darkworld_south', 'stumpy', inventory.none, false],
        ['darkworld_south', 'stumpy', inventory('moonpearl glove hammer'), true],
        ['darkworld_south', 'stumpy', inventory('moonpearl mitt'), true],
        ['darkworld_south', 'swamp_ne', inventory.none, false],
        ['darkworld_south', 'swamp_ne', inventory('moonpearl glove hammer'), true],
        ['darkworld_south', 'swamp_ne', inventory('moonpearl mitt'), true],
        ['darkworld_mire', 'mire_w', inventory.none, false],
        ['darkworld_mire', 'mire_w', inventory('flute mitt moonpearl'), true],
        (region, name, inventory, state) => it(`shows ${region} - ${name} ${as(state)} ${inventory}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.darkworld[name].should.equal(state);
        }));

        with_cases(
        ['darkworld_northwest', 'bumper', inventory('moonpearl hookshot glove cape'), true],
        ['darkworld_northwest', 'bumper', inventory('moonpearl hookshot flippers'), 'viewable'],
        ['darkworld_northwest', 'bumper', inventory('moonpearl hookshot glove'), 'viewable'],
        ['darkworld_northwest', 'bumper', inventory('moonpearl hookshot hammer'), 'viewable'],
        ['darkworld_northwest', 'chest_game', inventory('moonpearl hookshot flippers'), true],
        ['darkworld_northwest', 'chest_game', inventory('moonpearl hookshot glove'), true],
        ['darkworld_northwest', 'chest_game', inventory('moonpearl hookshot hammer'), true],
        ['darkworld_northwest', 'c_house', inventory('moonpearl hookshot flippers'), true],
        ['darkworld_northwest', 'c_house', inventory('moonpearl hookshot glove'), true],
        ['darkworld_northwest', 'c_house', inventory('moonpearl hookshot hammer'), true],
        ['darkworld_northwest', 'bomb_hut', inventory('moonpearl hookshot flippers'), true],
        ['darkworld_northwest', 'bomb_hut', inventory('moonpearl hookshot glove'), true],
        ['darkworld_northwest', 'bomb_hut', inventory('moonpearl hookshot hammer'), true],
        ['darkworld_northeast', 'catfish', inventory('moonpearl glove'), true],
        ['darkworld_northeast', 'pyramid', inventory.none, true],
        ['darkworld_south', 'dig_game', inventory('moonpearl hammer'), true],
        ['darkworld_south', 'dig_game', inventory('moonpearl hookshot glove'), true],
        ['darkworld_south', 'dig_game', inventory('moonpearl hookshot flippers'), true],
        ['darkworld_south', 'stumpy', inventory('moonpearl hammer'), true],
        ['darkworld_south', 'stumpy', inventory('moonpearl hookshot glove'), true],
        ['darkworld_south', 'stumpy', inventory('moonpearl hookshot flippers'), true],
        ['darkworld_south', 'swamp_ne', inventory('moonpearl hammer'), true],
        ['darkworld_south', 'swamp_ne', inventory('moonpearl hookshot glove'), true],
        ['darkworld_south', 'swamp_ne', inventory('moonpearl hookshot flippers'), true],
        (region, name, inventory, state) => it(`shows ${region} - ${name} ${as(state)} ${inventory}, and agahnim defeated`, () => {
            model.toggle_completion('castle_tower');
            inventory.update(model);
            const actual = model.state();
            actual.darkworld[name].should.equal(state);
        }));

        with_cases(
        [inventory('moonpearl glove hammer'), true],
        (inventory, state) => it(`shows darkworld_northeast - fairy_dw ${as(state)} ${inventory} when two red crystals have been acquired`, () => {
            model.toggle_completion('eastern');
            model.toggle_completion('desert');
            _.times(4, () => model.raise_prize('eastern'));
            _.times(4, () => model.raise_prize('desert'));
            inventory.update(model);
            const actual = model.state();
            actual.darkworld.fairy_dw.should.equal(state);
        }));

        with_cases(
        [inventory('moonpearl hammer'), true],
        [inventory('moonpearl mitt mirror'), true],
        [inventory('moonpearl hookshot glove mirror'), true],
        [inventory('moonpearl hookshot flippers mirror'), true],
        (inventory, state) => it(`shows darkworld_northeast - fairy_dw ${as(state)} ${inventory}, and agahnim defeated when two red crystals have been acquired`, () => {
            model.toggle_completion('eastern');
            model.toggle_completion('desert');
            _.times(4, () => model.raise_prize('eastern'));
            _.times(4, () => model.raise_prize('desert'));
            model.toggle_completion('castle_tower');
            inventory.update(model);
            const actual = model.state();
            actual.darkworld.fairy_dw.should.equal(state);
        }));

    });

    context('in standard mode', () => {

        beforeEach(() => {
            model = create_model({ standard: true });
        });

        with_cases(
        ['castle_escape', 'sanctuary'],
        ['castle_escape', 'escape_dark'],
        ['castle_escape', 'castle'],
        ['castle_escape', 'secret'],
        ['lightworld_south', 'link_house'],
        (region, name) => it(`shows ${region} - ${name} as marked initially`, () => {
            const actual = model.state()
            actual.lightworld[name].should.equal('marked');
        }));

        it('shows castle_escape - escape_side as unmarked initially', () => {
            const actual = model.state();
            actual.lightworld.escape_side.should.not.equal('marked');
        });

        with_cases(
        ['escape_side'],
        ['escape_dark', 'toggle'],
        (name, toggle) => it(`shows castle_escape - ${name} as available without any items`, () => {
            toggle && model.toggle_overworld_mark('castle_escape', name);
            const actual = model.state();
            actual.lightworld[name].should.be.true;
        }));

    });

    context('in keysanity mode', () => {

        beforeEach(() => {
            model = create_model({ keysanity: true, open: true });
        });

        it("can level ganon's tower chests", () => {
            model.raise_chest('ganon_tower');
            model.state().ganon_tower.chests.should.equal(0);

            model.lower_chest('ganon_tower');
            model.state().ganon_tower.chests.should.equal(27);
        });

        it("can level ganon's tower keys", () => {
            model.lower_key('ganon_tower');
            model.state().ganon_tower.keys.should.equal(4);

            model.raise_key('ganon_tower');
            model.state().ganon_tower.keys.should.equal(0);
        });

        it("can toggle ganon's tower big key", () => {
            model.toggle_big_key('ganon_tower');
            model.state().ganon_tower.big_key.should.be.true;
        });

        with_cases({
            eastern: 6, desert: 6, hera: 6, darkness: 14, swamp: 10,
            skull: 7, thieves: 8, ice: 8, mire: 8, turtle: 12
        }, (dungeon, chests) => it(`${dungeon} should start out with ${chests} chests`, () => {
            model.state().dungeons[dungeon].chests.should.equal(chests);
        }));

        it('can level dungeon keys', () => {
            model.lower_key('darkness');
            model.state().dungeons.darkness.keys.should.equal(6);

            model.raise_key('darkness');
            model.state().dungeons.darkness.keys.should.equal(0);
        });

        with_cases({
            eastern: 0, desert: 1, hera: 1, darkness: 6, swamp: 1,
            skull: 2, thieves: 1, ice: 2, mire: 3, turtle: 4
        }, (dungeon, keys) => it(`${dungeon} should have a maximum of ${keys} keys`, () => {
            model.lower_key(dungeon);
            model.state().dungeons[dungeon].keys.should.equal(keys);
        }));

        context('dungeons', () => {

            // Todo: check progressable together with location marking

            context('eastern palace', () => {

                with_cases(
                [dungeon.initial, inventory.none, 'compass', true],
                [dungeon.initial, inventory.none, 'cannonball', true],
                [dungeon.initial, inventory.none, 'map', true],
                [dungeon.initial, inventory.none, 'big_chest', false],
                [dungeon({ big_key: true }), inventory.none, 'big_chest', true],
                [dungeon.initial, inventory.none, 'big_key', 'dark'],
                [dungeon.initial, inventory('lamp'), 'big_key', true],
                [dungeon.initial, inventory.none, 'boss', false],
                [dungeon({ big_key: true }), inventory('bow'), 'boss', 'dark'],
                [dungeon({ big_key: true }), inventory('bow lamp'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'eastern');
                    inventory.update(model);
                    model.state().dungeons.eastern.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory.none, false],
                [dungeon({ big_key: true }), inventory('bow'), 'dark'],
                [dungeon({ big_key: true }), inventory('bow lamp'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'eastern');
                    inventory.update(model);
                    model.state().dungeons.eastern.completable.should.equal(state);
                }));

            });

            context('tower of hera', () => {

                with_cases(
                [dungeon.initial, inventory.none, 'cage', false],
                [dungeon.initial, inventory('mirror flute'), 'cage', true],
                [dungeon.initial, inventory('mirror glove lamp'), 'cage', true],
                [dungeon.initial, inventory('mirror glove'), 'cage', 'dark'],
                [dungeon.initial, inventory('hookshot hammer flute'), 'cage', true],
                [dungeon.initial, inventory('hookshot hammer glove lamp'), 'cage', true],
                [dungeon.initial, inventory('hookshot hammer glove'), 'cage', 'dark'],
                [dungeon.initial, inventory.none, 'map', false],
                [dungeon.initial, inventory('mirror flute'), 'map', true],
                [dungeon.initial, inventory('mirror glove lamp'), 'map', true],
                [dungeon.initial, inventory('mirror glove'), 'map', 'dark'],
                [dungeon.initial, inventory('hookshot hammer flute'), 'map', true],
                [dungeon.initial, inventory('hookshot hammer glove lamp'), 'map', true],
                [dungeon.initial, inventory('hookshot hammer glove'), 'map', 'dark'],
                [dungeon.initial, inventory.none, 'big_key', false],
                [dungeon({ keys: 1 }), inventory('mirror flute firerod'), 'big_key', true],
                [dungeon({ keys: 1 }), inventory('mirror flute lamp'), 'big_key', true],
                [dungeon({ keys: 1 }), inventory('mirror glove firerod'), 'big_key', 'dark'],
                [dungeon({ keys: 1 }), inventory('mirror glove lamp'), 'big_key', true],
                [dungeon({ keys: 1 }), inventory('hookshot hammer flute firerod'), 'big_key', true],
                [dungeon({ keys: 1 }), inventory('hookshot hammer flute lamp'), 'big_key', true],
                [dungeon({ keys: 1 }), inventory('hookshot hammer glove firerod'), 'big_key', 'dark'],
                [dungeon({ keys: 1 }), inventory('hookshot hammer glove lamp'), 'big_key', true],
                [dungeon.initial, inventory.none, 'compass', false],
                [dungeon({ big_key: true }), inventory('mirror flute'), 'compass', true],
                [dungeon({ big_key: true }), inventory('mirror glove lamp'), 'compass', true],
                [dungeon({ big_key: true }), inventory('mirror glove'), 'compass', 'dark'],
                [dungeon({ big_key: true }), inventory('hookshot hammer flute'), 'compass', true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove lamp'), 'compass', true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove'), 'compass', 'dark'],
                [dungeon.initial, inventory.none, 'big_chest', false],
                [dungeon({ big_key: true }), inventory('mirror flute'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('mirror glove lamp'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('mirror glove'), 'big_chest', 'dark'],
                [dungeon({ big_key: true }), inventory('hookshot hammer flute'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove lamp'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove'), 'big_chest', 'dark'],
                [dungeon.initial, inventory.none, 'boss', false],
                [dungeon({ big_key: true }), inventory('mirror flute sword'), 'boss', true],
                [dungeon({ big_key: true }), inventory('mirror flute hammer'), 'boss', true],
                [dungeon({ big_key: true }), inventory('mirror glove lamp sword'), 'boss', true],
                [dungeon({ big_key: true }), inventory('mirror glove lamp hammer'), 'boss', true],
                [dungeon({ big_key: true }), inventory('mirror glove sword'), 'boss', 'dark'],
                [dungeon({ big_key: true }), inventory('mirror glove hammer'), 'boss', 'dark'],
                [dungeon({ big_key: true }), inventory('hookshot hammer flute'), 'boss', true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove lamp'), 'boss', true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove'), 'boss', 'dark'],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'hera');
                    inventory.update(model);
                    model.state().dungeons.hera.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory.none, false],
                [dungeon({ big_key: true }), inventory('mirror flute sword'), true],
                [dungeon({ big_key: true }), inventory('mirror flute hammer'), true],
                [dungeon({ big_key: true }), inventory('mirror glove lamp sword'), true],
                [dungeon({ big_key: true }), inventory('mirror glove lamp hammer'), true],
                [dungeon({ big_key: true }), inventory('mirror glove sword'), 'dark'],
                [dungeon({ big_key: true }), inventory('mirror glove hammer'), 'dark'],
                [dungeon({ big_key: true }), inventory('hookshot hammer flute'), true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove lamp'), true],
                [dungeon({ big_key: true }), inventory('hookshot hammer glove'), 'dark'],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'hera');
                    inventory.update(model);
                    model.state().dungeons.hera.completable.should.equal(state);
                }));

            });

            context('swamp palace', () => {

                with_cases(
                [dungeon.initial, inventory.none, 'entrance', false],
                [dungeon.initial, inventory('moonpearl mirror flippers glove hammer'), 'entrance', true],
                [dungeon.initial, inventory('moonpearl mirror flippers mitt'), 'entrance', true],
                [dungeon.initial, inventory.none, 'map', false],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer'), 'map', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers mitt'), 'map', true],
                [dungeon.initial, inventory.none, 'big_key', false],
                [dungeon.initial, inventory.none, 'west', false],
                [dungeon.initial, inventory.none, 'compass', false],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer'), 'big_key', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer'), 'west', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer'), 'compass', true],
                [dungeon.initial, inventory.none, 'big_chest', false],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl mirror flippers glove hammer'), 'big_chest', true],
                [dungeon.initial, inventory.none, 'waterfall', false],
                [dungeon.initial, inventory.none, 'toilet_left', false],
                [dungeon.initial, inventory.none, 'toilet_right', false],
                [dungeon.initial, inventory.none, 'boss', false],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer hookshot'), 'waterfall', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer hookshot'), 'toilet_left', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer hookshot'), 'toilet_right', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer hookshot'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'swamp');
                    inventory.update(model);
                    model.state().dungeons.swamp.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory('moonpearl mirror flippers hammer'), 'entrance', true],
                [dungeon.initial, inventory('moonpearl mirror flippers hookshot'), 'entrance', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer'), 'map', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hookshot'), 'map', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer'), 'big_key', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer'), 'west', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer'), 'compass', true],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl mirror flippers hammer'), 'big_chest', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer hookshot'), 'waterfall', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer hookshot'), 'toilet_left', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer hookshot'), 'toilet_right', true],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer hookshot'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                    model.toggle_completion('castle_tower');
                    dungeon.update(model, 'swamp');
                    inventory.update(model);
                    model.state().dungeons.swamp.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory.none, false],
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers glove hammer hookshot'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'swamp');
                    inventory.update(model);
                    model.state().dungeons.swamp.completable.should.equal(state);
                }));

                with_cases(
                [dungeon({ keys: 1 }), inventory('moonpearl mirror flippers hammer hookshot'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                    model.toggle_completion('castle_tower');
                    dungeon.update(model, 'swamp');
                    inventory.update(model);
                    model.state().dungeons.swamp.completable.should.equal(state);
                }));

            });

            context('skull woods', () => {

                with_cases(
                [dungeon.initial, inventory.none, 'big_key', false],
                [dungeon.initial, inventory.none, 'compass', false],
                [dungeon.initial, inventory.none, 'map', false],
                [dungeon.initial, inventory.none, 'pot_prison', false],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'compass', true],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'map', true],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'pot_prison', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'compass', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'map', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'pot_prison', true],
                [dungeon.initial, inventory.none, 'big_chest', false],
                [dungeon({ big_key: true }), inventory('moonpearl glove hammer'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt'), 'big_chest', true],
                [dungeon.initial, inventory.none, 'bridge', false],
                [dungeon.initial, inventory('moonpearl glove hammer firerod'), 'bridge', true],
                [dungeon.initial, inventory('moonpearl mitt firerod'), 'bridge', true],
                [dungeon.initial, inventory.none, 'boss', false],
                [dungeon.initial, inventory('moonpearl glove hammer firerod sword'), 'boss', true],
                [dungeon.initial, inventory('moonpearl mitt firerod sword'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'skull');
                    inventory.update(model);
                    model.state().dungeons.skull.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'compass', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'map', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'pot_prison', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'compass', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'map', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'pot_prison', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'compass', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'map', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'pot_prison', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot hammer'), 'big_chest', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers firerod'), 'bridge', true],
                [dungeon.initial, inventory('moonpearl hookshot glove firerod'), 'bridge', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer firerod'), 'bridge', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers firerod sword'), 'boss', true],
                [dungeon.initial, inventory('moonpearl hookshot glove firerod sword'), 'boss', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer firerod sword'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                    model.toggle_completion('castle_tower');
                    dungeon.update(model, 'skull');
                    inventory.update(model);
                    model.state().dungeons.skull.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory.none, false],
                [dungeon.initial, inventory('moonpearl glove hammer firerod sword'), true],
                [dungeon.initial, inventory('moonpearl mitt firerod sword'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'skull');
                    inventory.update(model);
                    model.state().dungeons.skull.completable.should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory('moonpearl hookshot flippers firerod sword'), true],
                [dungeon.initial, inventory('moonpearl hookshot glove firerod sword'), true],
                [dungeon.initial, inventory('moonpearl hookshot hammer firerod sword'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                    model.toggle_completion('castle_tower');
                    dungeon.update(model, 'skull');
                    inventory.update(model);
                    model.state().dungeons.skull.completable.should.equal(state);
                }));

            });

            context("thieves' town", () => {

                with_cases(
                [dungeon.initial, inventory.none, 'big_key', false],
                [dungeon.initial, inventory.none, 'map', false],
                [dungeon.initial, inventory.none, 'compass', false],
                [dungeon.initial, inventory.none, 'ambush', false],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'map', true],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'compass', true],
                [dungeon.initial, inventory('moonpearl glove hammer'), 'ambush', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'map', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'compass', true],
                [dungeon.initial, inventory('moonpearl mitt'), 'ambush', true],
                [dungeon.initial, inventory.none, 'attic', false],
                [dungeon.initial, inventory.none, 'cell', false],
                [dungeon({ big_key: true }), inventory('moonpearl glove hammer'), 'attic', true],
                [dungeon({ big_key: true }), inventory('moonpearl glove hammer'), 'cell', true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt'), 'attic', true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt'), 'cell', true],
                [dungeon.initial, inventory.none, 'big_chest', false],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl glove hammer'), 'big_chest', true],
                [dungeon.initial, inventory.none, 'boss', false],
                [dungeon({ big_key: true }), inventory('moonpearl glove hammer'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt sword'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt somaria'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt byrna'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'thieves');
                    inventory.update(model);
                    model.state().dungeons.thieves.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'map', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'compass', true],
                [dungeon.initial, inventory('moonpearl hookshot flippers'), 'ambush', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'map', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'compass', true],
                [dungeon.initial, inventory('moonpearl hookshot glove'), 'ambush', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'map', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'compass', true],
                [dungeon.initial, inventory('moonpearl hookshot hammer'), 'ambush', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers'), 'attic', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers'), 'cell', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove'), 'attic', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove'), 'cell', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot hammer'), 'attic', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot hammer'), 'cell', true],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl hookshot hammer'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot hammer'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers sword'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers somaria'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers byrna'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove sword'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove somaria'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove byrna'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                    model.toggle_completion('castle_tower');
                    dungeon.update(model, 'thieves');
                    inventory.update(model);
                    model.state().dungeons.thieves.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory.none, false],
                [dungeon({ big_key: true }), inventory('moonpearl glove hammer'), true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt sword'), true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt somaria'), true],
                [dungeon({ big_key: true }), inventory('moonpearl mitt byrna'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'thieves');
                    inventory.update(model);
                    model.state().dungeons.thieves.completable.should.equal(state);
                }));

                with_cases(
                [dungeon({ big_key: true }), inventory('moonpearl hookshot hammer'), true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers sword'), true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers somaria'), true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot flippers byrna'), true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove sword'), true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove somaria'), true],
                [dungeon({ big_key: true }), inventory('moonpearl hookshot glove byrna'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}, and agahnim defeated`, () => {
                    model.toggle_completion('castle_tower');
                    dungeon.update(model, 'thieves');
                    inventory.update(model);
                    model.state().dungeons.thieves.completable.should.equal(state);
                }));

            });

            context('ice palace', () => {

                with_cases(
                [dungeon.initial, inventory.none, 'compass', false],
                [dungeon.initial, inventory.none, 'freezor', false],
                [dungeon.initial, inventory.none, 'iced_t', false],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos'), 'compass', true],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos'), 'freezor', true],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos'), 'iced_t', true],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod'), 'compass', true],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod'), 'freezor', true],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod'), 'iced_t', true],
                [dungeon.initial, inventory.none, 'big_chest', false],
                [dungeon({ big_key: true }), inventory('moonpearl flippers mitt sword bombos'), 'big_chest', true],
                [dungeon({ big_key: true }), inventory('moonpearl flippers mitt firerod'), 'big_chest', true],
                [dungeon.initial, inventory.none, 'spike', false],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos'), 'spike', 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod'), 'spike', 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hookshot'), 'spike', true],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod hookshot'), 'spike', true],
                [dungeon.initial, inventory.none, 'map', false],
                [dungeon.initial, inventory.none, 'big_key', false],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), 'map', 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), 'big_key', 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), 'map', 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), 'big_key', 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer hookshot'), 'map', true],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer hookshot'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer hookshot'), 'map', true],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer hookshot'), 'big_key', true],
                [dungeon.initial, inventory.none, 'boss', false],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), 'boss', 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), 'boss', 'possible'],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl flippers mitt sword bombos hammer somaria'), 'boss', true],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl flippers mitt firerod hammer somaria'), 'boss', true],
                [dungeon({ keys: 2, big_key: true }), inventory('moonpearl flippers mitt sword bombos hammer'), 'boss', true],
                [dungeon({ keys: 2, big_key: true }), inventory('moonpearl flippers mitt firerod hammer'), 'boss', true],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'ice');
                    inventory.update(model);
                    model.state().dungeons.ice.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory.none, false],
                [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), 'possible'],
                [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), 'possible'],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl flippers mitt sword bombos hammer somaria'), true],
                [dungeon({ keys: 1, big_key: true }), inventory('moonpearl flippers mitt firerod hammer somaria'), true],
                [dungeon({ keys: 2, big_key: true }), inventory('moonpearl flippers mitt sword bombos hammer'), true],
                [dungeon({ keys: 2, big_key: true }), inventory('moonpearl flippers mitt firerod hammer'), true],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'ice');
                    inventory.update(model);
                    model.state().dungeons.ice.completable.should.equal(state);
                }));

                context('using bomb jump', () => {

                    beforeEach(() => {
                        model = create_model({ keysanity: true, open: true, bomb_jump: true });
                    });

                    with_cases(
                    [dungeon.initial, inventory('moonpearl flippers mitt sword bombos'), 'spike', true],
                    [dungeon.initial, inventory('moonpearl flippers mitt firerod'), 'spike', true],
                    [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), 'map', true],
                    [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), 'big_key', true],
                    [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), 'map', true],
                    [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), 'big_key', true],
                    [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), 'boss', true],
                    [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), 'boss', true],
                    (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                        dungeon.update(model, 'ice');
                        inventory.update(model);
                        model.state().dungeons.ice.locations[location].should.equal(state);
                    }));

                    with_cases(
                    [dungeon.initial, inventory('moonpearl flippers mitt sword bombos hammer'), true],
                    [dungeon.initial, inventory('moonpearl flippers mitt firerod hammer'), true],
                    (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                        dungeon.update(model, 'ice');
                        inventory.update(model);
                        model.state().dungeons.ice.completable.should.equal(state);
                    }));

                });

            });

            context('misery mire', () => {

                it('uses region access logic for locations', () => {
                    inventory('bombos ether quake').update(model);
                    model.state().dungeons.mire.locations.main.should.equal(false);
                });

                with_cases(
                [dungeon.initial, inventory.none, 'main', false],
                [dungeon.initial, inventory.none, 'bridge', false],
                [dungeon.initial, inventory.none, 'map', false],
                [dungeon.initial, inventory.none, 'spike', false],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt bombos ether quake'), 'main', true],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt bombos ether quake'), 'bridge', true],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt bombos ether quake'), 'map', true],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt bombos ether quake'), 'spike', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt bombos'), 'main', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt bombos'), 'bridge', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt bombos'), 'map', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt bombos'), 'spike', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt ether'), 'main', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt ether'), 'bridge', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt ether'), 'map', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt ether'), 'spike', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt quake'), 'main', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt quake'), 'bridge', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt quake'), 'map', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt quake'), 'spike', true],
                [dungeon.initial, inventory.none, 'compass', false],
                [dungeon.initial, inventory.none, 'big_key', false],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt firerod bombos ether quake'), 'compass', true],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt firerod bombos ether quake'), 'big_key', true],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt lamp bombos ether quake'), 'compass', true],
                [dungeon.initial, inventory('moonpearl boots sword flute mitt lamp bombos ether quake'), 'big_key', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt firerod bombos'), 'compass', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt firerod bombos'), 'big_key', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt lamp bombos'), 'compass', true],
                [dungeon({ medallion: 1 }), inventory('moonpearl boots sword flute mitt lamp bombos'), 'big_key', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt firerod ether'), 'compass', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt firerod ether'), 'big_key', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt lamp ether'), 'compass', true],
                [dungeon({ medallion: 2 }), inventory('moonpearl boots sword flute mitt lamp ether'), 'big_key', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt firerod quake'), 'compass', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt firerod quake'), 'big_key', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt lamp quake'), 'compass', true],
                [dungeon({ medallion: 3 }), inventory('moonpearl boots sword flute mitt lamp quake'), 'big_key', true],
                [dungeon.initial, inventory.none, 'big_chest', false],
                [dungeon({ big_key: true }), inventory('moonpearl boots sword flute mitt bombos ether quake'), 'big_chest', true],
                [dungeon({ medallion: 1, big_key: true }), inventory('moonpearl boots sword flute mitt bombos'), 'big_chest', true],
                [dungeon({ medallion: 2, big_key: true }), inventory('moonpearl boots sword flute mitt ether'), 'big_chest', true],
                [dungeon({ medallion: 3, big_key: true }), inventory('moonpearl boots sword flute mitt quake'), 'big_chest', true],
                [dungeon.initial, inventory.none, 'boss', false],
                [dungeon({ big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos ether quake lamp'), 'boss', true],
                [dungeon({ big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos ether quake'), 'boss', 'dark'],
                [dungeon({ medallion: 1, big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos lamp'), 'boss', true],
                [dungeon({ medallion: 1, big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos'), 'boss', 'dark'],
                [dungeon({ medallion: 2, big_key: true }), inventory('moonpearl boots sword flute mitt somaria ether lamp'), 'boss', true],
                [dungeon({ medallion: 2, big_key: true }), inventory('moonpearl boots sword flute mitt somaria ether'), 'boss', 'dark'],
                [dungeon({ medallion: 3, big_key: true }), inventory('moonpearl boots sword flute mitt somaria quake lamp'), 'boss', true],
                [dungeon({ medallion: 3, big_key: true }), inventory('moonpearl boots sword flute mitt somaria quake'), 'boss', 'dark'],
                (dungeon, inventory, location, state) => it(`show ${location} ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'mire');
                    inventory.update(model);
                    model.state().dungeons.mire.locations[location].should.equal(state);
                }));

                with_cases(
                [dungeon.initial, inventory.none, false],
                [dungeon({ big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos ether quake lamp'), true],
                [dungeon({ big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos ether quake'), 'dark'],
                [dungeon({ medallion: 1, big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos lamp'), true],
                [dungeon({ medallion: 1, big_key: true }), inventory('moonpearl boots sword flute mitt somaria bombos'), 'dark'],
                [dungeon({ medallion: 2, big_key: true }), inventory('moonpearl boots sword flute mitt somaria ether lamp'), true],
                [dungeon({ medallion: 2, big_key: true }), inventory('moonpearl boots sword flute mitt somaria ether'), 'dark'],
                [dungeon({ medallion: 3, big_key: true }), inventory('moonpearl boots sword flute mitt somaria quake lamp'), true],
                [dungeon({ medallion: 3, big_key: true }), inventory('moonpearl boots sword flute mitt somaria quake'), 'dark'],
                (dungeon, inventory, state) => it(`show completable ${as(state)} for ${dungeon} ${inventory}`, () => {
                    dungeon.update(model, 'mire');
                    inventory.update(model);
                    model.state().dungeons.mire.completable.should.equal(state);
                }));

            });

        });

    });

});
