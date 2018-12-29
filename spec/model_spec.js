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
        (region, name) => it(`shows ${region} - ${name} as available`, () => {
            const actual = model.state();
            actual.lightworld[name].should.be.true;
        }));

    });

});
