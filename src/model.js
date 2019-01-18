(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('./items'),
            require('./world'),
            require('../js/lib/immutable-update'),
            require('lodash'));
    } else {
        root.update = factory(root.create_items, root.create_world, root.update, root._);
    }
}(typeof self !== 'undefined' ? self : this, function(create_items, create_world, update, _) {
    const open_mode_setting = {};

    const create_model = () => {
        let world = create_world(open_mode_setting).world;
        let items = create_items().items;
        return {
            state() {
                const {
                    lightworld_deathmountain_west,
                    lightworld_deathmountain_east,
                    lightworld_northwest,
                    lightworld_northeast,
                    lightworld_south,
                    darkworld_deathmountain_west,
                    darkworld_deathmountain_east,
                    darkworld_northwest,
                    darkworld_northeast,
                    darkworld_south,
                    darkworld_mire
                } = world;
                const have_lightworld_northwest_can_enter = !!lightworld_northwest.can_enter;
                const have_lightworld_northeast_can_enter = !!lightworld_northeast.can_enter;
                const have_lightworld_south_can_enter = !!lightworld_south.can_enter;
                const have_darkworld_deathmountain_west_can_enter = !!darkworld_deathmountain_west.can_enter;
                const have_darkworld_deathmountain_east_can_enter = !!darkworld_deathmountain_east.can_enter;
                const have_darkworld_northwest_can_enter = !!darkworld_northwest.can_enter;
                const have_darkworld_northeast_can_enter = !!darkworld_northeast.can_enter;
                const have_darkworld_south_can_enter = !!darkworld_south.can_enter;
                const have_darkworld_mire_can_enter = !!darkworld_mire.can_enter;
                const region_state = (region, args) =>
                    !region.can_enter || region.can_enter(args) ||
                    !!region.can_enter_dark && region.can_enter_dark(args) && 'dark';
                const derive_state = (region, location) =>
                    region === true ? location :
                    location === true ? region :
                    location;
                let state;
                return { dungeons: {
                    eastern: {
                        completable: world.eastern.can_complete({ items }),
                        progressable: world.eastern.can_progress({ items, region: world.eastern })
                    },
                    desert: {
                        completable: (state = region_state(world.desert, { items })) &&
                            derive_state(state, world.desert.can_complete({ items })),
                        progressable: (state = region_state(world.desert, { items, region: world.desert })) &&
                            derive_state(state, world.desert.can_progress({ items, region: world.desert }))
                    },
                    hera: {
                        completable: (state = region_state(world.hera, { items, world })) &&
                            derive_state(state, world.hera.can_complete({ items, world })),
                        progressable: (state = region_state(world.hera, { items, world })) &&
                            derive_state(state, world.hera.can_progress({ items, world }))
                    },
                    darkness: {
                        completable: (state = region_state(world.darkness, { items, world })) &&
                            derive_state(state, world.darkness.can_complete({ items, world })),
                        progressable: (state = region_state(world.darkness, { items, world, region: world.darkness })) &&
                            derive_state(state, world.darkness.can_progress({ items, world, region: world.darkness }))
                    },
                    swamp: {
                        completable: (state = region_state(world.swamp, { items, world })) &&
                            derive_state(state, world.swamp.can_complete({ items, world })),
                        progressable: (state = region_state(world.swamp, { items, world, region: world.swamp })) &&
                            derive_state(state, world.swamp.can_progress({ items, world, region: world.swamp }))
                    }
                }, lightworld: {
                    ..._.mapValues(lightworld_deathmountain_west.locations, location =>
                        (state = region_state(lightworld_deathmountain_west, { items, world })) &&
                            derive_state(state, !location.can_access || location.can_access({ items, world }))),
                    ..._.mapValues(lightworld_deathmountain_east.locations, location =>
                        (state = region_state(lightworld_deathmountain_east, { items, world })) &&
                            derive_state(state, !location.can_access || location.can_access({ items, world }))),
                    ..._.mapValues(lightworld_northwest.locations, location =>
                        !have_lightworld_northwest_can_enter && (!location.can_access || location.can_access({ items, world }))),
                    ..._.mapValues(lightworld_northeast.locations, location =>
                        !have_lightworld_northeast_can_enter && (!location.can_access || location.can_access({ items, world }))),
                    ..._.mapValues(lightworld_south.locations, location =>
                        !have_lightworld_south_can_enter && (!location.can_access || location.can_access({ items, world })))
                }, darkworld: {
                    ..._.mapValues(darkworld_deathmountain_west.locations, location =>
                        !have_darkworld_deathmountain_west_can_enter && location.can_access),
                    ..._.mapValues(darkworld_deathmountain_east.locations, location =>
                        !have_darkworld_deathmountain_east_can_enter && location.can_access),
                    ..._.mapValues(darkworld_northwest.locations, location =>
                        !have_darkworld_northwest_can_enter && location.can_access),
                    ..._.mapValues(darkworld_northeast.locations, location =>
                        !have_darkworld_northeast_can_enter && location.can_access),
                    ..._.mapValues(darkworld_south.locations, location =>
                        !have_darkworld_south_can_enter && location.can_access),
                    ..._.mapValues(darkworld_mire.locations, location =>
                        !have_darkworld_mire_can_enter && location.can_access)
                } };
            },
            toggle_item(name) {
                items = update(items, update.toggle(name));
            },
            raise_item(name) {
                const limit = items.limit[name];
                const [max, min] = limit[0] ? limit : [limit, 0];
                const delta = 1;
                const modulo = max-min+1;
                const value = (items[name]-min + modulo + delta) % modulo + min;
                items = update(items, { [name]: { $set: value } });
            },
            toggle_completion(region) {
                world = update(world, { [region]: update.toggle('completed') });
            },
            lower_chest(region) {
                const { chests, chest_limit } = world[region];
                const delta = -1;
                const modulo = chest_limit + 1;
                const value = (chests + modulo + delta) % modulo;
                world = update(world, { [region]: { chests: { $set: value } } });
            }
        }
    };

    return create_model;
}));
