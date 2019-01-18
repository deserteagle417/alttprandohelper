const _ = require('lodash');

const with_cases = require('./spec_helper').with_cases;

const chai = require('chai');
const expect = chai.expect;
chai.should();

const create_model = require('../src/model');

const dungeon = ({ opened = 0 }) => {
    return {
        update(model, region) {
            _.times(opened, () => model.lower_chest(region));
        },
        toString() {
            return opened ?
                `dungeon with ${opened} opened chests` :
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

    });

    context('lightworld locations', () => {

        with_cases(
        ['lightworld_deathmountain_west', 'ether'],
        ['lightworld_deathmountain_west', 'spectacle_rock'],
        ['lightworld_deathmountain_west', 'spectacle_cave'],
        ['lightworld_deathmountain_west', 'old_man'],
        ['lightworld_deathmountain_east', 'island_dm'],
        ['lightworld_deathmountain_east', 'spiral'],
        ['lightworld_deathmountain_east', 'paradox'],
        ['lightworld_deathmountain_east', 'mimic'],
        ['lightworld_northwest', 'altar'],
        ['lightworld_northwest', 'graveyard_w'],
        ['lightworld_northwest', 'graveyard_n'],
        ['lightworld_northwest', 'graveyard_e'],
        ['lightworld_northwest', 'kid'],
        ['lightworld_northwest', 'frog'],
        ['lightworld_northwest', 'bat'],
        ['lightworld_northeast', 'zora'],
        ['lightworld_northeast', 'river'],
        ['lightworld_northeast', 'fairy_lw'],
        ['lightworld_northeast', 'witch'],
        ['lightworld_northeast', 'sahasrahla'],
        ['lightworld_south', 'grove_n'],
        ['lightworld_south', 'grove_s'],
        ['lightworld_south', 'desert_ne'],
        ['lightworld_south', 'bombos'],
        ['lightworld_south', 'hobo'],
        (region, name) => it(`shows ${region} - ${name} as unavailable without any items`, () => {
            const actual = model.state();
            actual.lightworld[name].should.be.false;
        }));

        with_cases(
        ['lightworld_northwest', 'tree'],
        ['lightworld_south', 'library'],
        ['lightworld_south', 'desert_w'],
        ['lightworld_south', 'island_lake'],
        (region, name) => it(`shows ${region} - ${name} as viewable without any items`, () => {
            const actual = model.state();
            actual.lightworld[name].should.equal('viewable');
        }));

        with_cases(
        ['lightworld_northwest', 'mushroom'],
        ['lightworld_northwest', 'hideout'],
        ['lightworld_northwest', 'well'],
        ['lightworld_northwest', 'thief_hut'],
        ['lightworld_northwest', 'bottle'],
        ['lightworld_northwest', 'chicken'],
        ['lightworld_northwest', 'tavern'],
        ['lightworld_northeast', 'sahasrahla_hut'],
        ['lightworld_south', 'maze'],
        ['lightworld_south', 'link_house'],
        ['lightworld_south', 'aginah'],
        ['lightworld_south', 'dam'],
        ['lightworld_south', 'lake_sw'],
        ['lightworld_south', 'ice_cave'],
        (region, name) => it(`shows ${region} - ${name} as available without any items`, () => {
            const actual = model.state();
            actual.lightworld[name].should.be.true;
        }));

        with_cases(
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('glove')],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('flute')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('glove mirror hammer')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute mirror hammer')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('glove hookshot')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute hookshot')],
        ['lightworld_northeast', 'river', inventory('glove')],
        (region, name, inventory) => it(`shows ${region} - ${name} as viewable ${inventory}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.lightworld[name].should.equal('viewable');
        }));

        with_cases(
        ['lightworld_deathmountain_west', 'old_man', inventory('glove')],
        ['lightworld_deathmountain_west', 'old_man', inventory('flute')],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('glove mirror')],
        ['lightworld_deathmountain_west', 'spectacle_cave', inventory('glove')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('hammer mitt moonpearl mirror')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('hookshot mitt moonpearl mirror')],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove mirror hammer')],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove hookshot')],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove hammer mirror')],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove hookshot')],
        (region, name, inventory) => it(`shows ${region} - ${name} as dark ${inventory}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.lightworld[name].should.equal('dark');
        }));

        with_cases(
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('glove lamp mirror')],
        ['lightworld_deathmountain_west', 'spectacle_rock', inventory('flute mirror')],
        ['lightworld_deathmountain_west', 'spectacle_cave', inventory('glove lamp')],
        ['lightworld_deathmountain_west', 'spectacle_cave', inventory('flute')],
        ['lightworld_deathmountain_west', 'old_man', inventory('glove lamp')],
        ['lightworld_deathmountain_west', 'old_man', inventory('flute lamp')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('lamp hammer mitt moonpearl mirror')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute hammer mitt moonpearl mirror')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('lamp hookshot mitt moonpearl mirror')],
        ['lightworld_deathmountain_east', 'island_dm', inventory('flute hookshot mitt moonpearl mirror')],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove lamp hammer mirror')],
        ['lightworld_deathmountain_east', 'spiral', inventory('flute hammer mirror')],
        ['lightworld_deathmountain_east', 'spiral', inventory('glove lamp hookshot')],
        ['lightworld_deathmountain_east', 'spiral', inventory('flute hookshot')],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove lamp hammer mirror')],
        ['lightworld_deathmountain_east', 'paradox', inventory('flute hammer mirror')],
        ['lightworld_deathmountain_east', 'paradox', inventory('glove lamp hookshot')],
        ['lightworld_deathmountain_east', 'paradox', inventory('flute hookshot')],
        ['lightworld_northwest', 'graveyard_w', inventory('boots')],
        ['lightworld_northwest', 'kid', inventory('bottle')],
        ['lightworld_northeast', 'zora', inventory('flippers')],
        ['lightworld_northeast', 'zora', inventory('glove')],
        ['lightworld_northeast', 'river', inventory('flippers')],
        ['lightworld_northeast', 'fairy_lw', inventory('flippers')],
        ['lightworld_northeast', 'witch', inventory('mushroom')],
        ['lightworld_south', 'library', inventory('boots')],
        ['lightworld_south', 'grove_n', inventory('shovel')],
        ['lightworld_south', 'hobo', inventory('flippers')],
        (region, name, inventory) => it(`shows ${region} - ${name} as available ${inventory}`, () => {
            inventory.update(model);
            const actual = model.state();
            actual.lightworld[name].should.be.true;
        }));

    });

    context('darkworld locations', () => {

        with_cases(
        ['darkworld_deathmountain_west', 'spike'],
        ['darkworld_deathmountain_east', 'rock_hook'],
        ['darkworld_deathmountain_east', 'rock_boots'],
        ['darkworld_deathmountain_east', 'bunny'],
        ['darkworld_northwest', 'bumper'],
        ['darkworld_northwest', 'chest_game'],
        ['darkworld_northwest', 'c_house'],
        ['darkworld_northwest', 'bomb_hut'],
        ['darkworld_northwest', 'purple'],
        ['darkworld_northwest', 'pegs'],
        ['darkworld_northeast', 'catfish'],
        ['darkworld_northeast', 'pyramid'],
        ['darkworld_northeast', 'fairy_dw'],
        ['darkworld_south', 'dig_game'],
        ['darkworld_south', 'stumpy'],
        ['darkworld_south', 'swamp_ne'],
        ['darkworld_mire', 'mire_w'],
        (region, name) => it(`shows ${region} - ${name} as unavailable without any items`, () => {
            const actual = model.state();
            actual.darkworld[name].should.be.false;
        }));

    });

});
