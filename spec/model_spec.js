const with_cases = require('./spec_helper').with_cases;

const chai = require('chai');
const expect = chai.expect;
chai.should();

const create_model = require('../src/model');

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

    });

});
