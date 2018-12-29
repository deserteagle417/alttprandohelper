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
                const { altar, mushroom, hideout, tree, graveyard_w, graveyard_n,
                    graveyard_e, well, thief_hut, bottle, chicken, kid, tavern, frog, bat } =
                    world.lightworld_northwest.locations;
                const { zora, river, fairy_lw, witch, sahasrahla_hut, sahasrahla } =
                    world.lightworld_northeast.locations;
                const { maze, library, grove_n, grove_s, link_house, desert_w, desert_ne,
                    aginah, bombos, dam, lake_sw, island_lake, hobo, ice_cave } =
                    world.lightworld_south.locations;
                return { lightworld: {
                    altar: !altar.can_access,
                    mushroom: !mushroom.can_access,
                    hideout: !hideout.can_access,
                    tree: !tree.can_access,
                    graveyard_w: !graveyard_w.can_access,
                    graveyard_n: !graveyard_n.can_access,
                    graveyard_e: !graveyard_e.can_access,
                    well: !well.can_access,
                    thief_hut: !thief_hut.can_access,
                    bottle: !bottle.can_access,
                    chicken: !chicken.can_access,
                    kid: !kid.can_access,
                    tavern: !tavern.can_access,
                    frog: !frog.can_access,
                    bat: !bat.can_access,
                    zora: !zora.can_access,
                    river: !river.can_access,
                    fairy_lw: !fairy_lw.can_access,
                    witch: !witch.can_access,
                    sahasrahla_hut: !sahasrahla_hut.can_access,
                    sahasrahla: !sahasrahla.can_access,
                    maze: !maze.can_access,
                    library: !library.can_access,
                    grove_n: !grove_n.can_access,
                    grove_s: !grove_s.can_access,
                    link_house: !link_house.can_access,
                    desert_w: !desert_w.can_access,
                    desert_ne: !desert_ne.can_access,
                    aginah: !aginah.can_access,
                    bombos: !bombos.can_access,
                    dam: !dam.can_access,
                    lake_sw: !lake_sw.can_access,
                    island_lake: !island_lake.can_access,
                    hobo: !hobo.can_access,
                    ice_cave: !ice_cave.can_access
                } };
            }
        }
    };

    return create_model;
}));
