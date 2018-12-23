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
        (region, name) => it(`shows ${region} - ${name} as available`, () => {
            const actual = model.state();
            actual.lightworld[name].should.be.true;
        }));

    });

});
