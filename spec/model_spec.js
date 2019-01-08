const _ = require('lodash');

const with_cases = require('./spec_helper').with_cases;

const chai = require('chai');
const expect = chai.expect;
chai.should();

const create_model = require('../src/model');

const inventory = (tokens) => {
    tokens = tokens.split(' ');
    return {
        update(model) {
            const raise = {
                bottle: ['bottle', 1],
                glove: ['glove', 1]
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
            return tokens.join(', ');
        }
    }
};

describe('Model', () => {

    let model;

    beforeEach(() => {
        model = create_model();
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
        (region, name, inventory) => it(`shows ${region} - ${name} as available with ${inventory}`, () => {
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
