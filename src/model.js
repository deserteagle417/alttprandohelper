(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./world'));
    } else {
        root.update = factory(root.create_world);
    }
}(typeof self !== 'undefined' ? self : this, function(create_world) {
    const open_mode_setting = {};
    const world = create_world(open_mode_setting).world;

    const create_model = () => {
        return {
            state() {
                const { mushroom, hideout, well, thief_hut, bottle, chicken, tavern } =
                    world.lightworld_northwest.locations;
                const { sahasrahla_hut } = world.lightworld_northeast.locations;
                const { maze, link_house, aginah, dam, lake_sw, ice_cave } =
                    world.lightworld_south.locations;
                return { lightworld: {
                    mushroom: !mushroom.can_access,
                    hideout: !hideout.can_access,
                    well: !well.can_access,
                    thief_hut: !thief_hut.can_access,
                    bottle: !bottle.can_access,
                    chicken: !chicken.can_access,
                    tavern: !tavern.can_access,
                    sahasrahla_hut: !sahasrahla_hut.can_access,
                    maze: !maze.can_access,
                    link_house: !link_house.can_access,
                    aginah: !aginah.can_access,
                    dam: !dam.can_access,
                    lake_sw: !lake_sw.can_access,
                    ice_cave: !ice_cave.can_access,
                } };
            }
        }
    };

    return create_model;
}));
