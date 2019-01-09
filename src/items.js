(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('lodash'));
    } else {
        root.create_items = factory(root._);
    }
}(typeof self !== 'undefined' ? self : this, function(_) {
    'use strict';

    const items_base = {
        get fightersword() { return this.sword >= 1; },
        get mastersword() { return this.sword >= 2; },
        get can_shoot_bow() { return this.bow > 1; },
        get has_cane() { return this.somaria || this.byrna; },
        get has_rod() { return this.firerod || this.icerod; },
        get can_lift_light() { return this.glove >= 1; },
        get can_lift_heavy() { return this.glove >= 2; },
        get can_flute() { return this.flute; },
        get can_light_torch() { return this.lamp || this.firerod; },
        get can_melt() { return this.firerod || (/*mode.swordless ||*/ this.fightersword) && this.bombos },
        get can_avoid_laser() { return this.cape || this.byrna || this.shield >= 3; },
        get has_bottle() { return this.bottle >= 1; },

        has_medallion(medallion) {
            return this.bombos && this.ether && this.quake || medallion !== 'unknown' && this[medallion];
        },
        might_have_medallion(medallion) {
            return medallion === 'unknown' && (this.bombos || this.ether || this.quake);
        },

        limit: {
            tunic: [3, 1],
            sword: 4,
            shield: 3,
            bottle: 4,
            bow: 3,
            boomerang: 3,
            glove: 2
        }
    };

    const items = {
        tunic: 1,
        sword: 0,
        shield: 0,
        moonpearl: false,

        bow: 0,
        boomerang: 0,
        hookshot: false,
        mushroom: false,
        powder: false,

        firerod: false,
        icerod: false,
        bombos: false,
        ether: false,
        quake: false,

        lamp: false,
        hammer: false,
        shovel: false,
        net: false,
        book: false,

        bottle: 0,
        somaria: false,
        byrna: false,
        cape: false,
        mirror: false,

        boots: false,
        glove: 0,
        flippers: false,
        flute: false
    };

    var create_items = () => ({ items: _.create(items_base, items) });

    return create_items;
}));
