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
    const prizes = ['unknown', 'pendant-green', 'pendant', 'crystal', 'crystal-red'];
    const medallions = ['unknown', 'bombos', 'ether', 'quake'];

    const create_model = () => {
        const mode = open_mode_setting;
        let world = create_world(mode).world;
        let items = create_items().items;
        return {
            state() {
                const {
                    lightworld_deathmountain_west,
                    lightworld_deathmountain_east,
                    lightworld_northwest,
                    lightworld_northeast,
                    lightworld_south,
                    castle_escape,
                    castle_tower,
                    darkworld_deathmountain_west,
                    darkworld_deathmountain_east,
                    darkworld_northwest,
                    darkworld_northeast,
                    darkworld_south,
                    darkworld_mire
                } = world;
                const args = { items, world, mode };
                const region_state = (region, args) =>
                    !region.can_enter || region.can_enter(args) ||
                    !!region.can_enter_dark && region.can_enter_dark(args) && 'dark';
                const derive_state = (region, location) =>
                    region === true ? location :
                    location === true ? region :
                    location;
                let state;
                const dungeon = (region, args) => ({
                    completable: (state = region_state(region, args)) && derive_state(state, region.can_complete(args)),
                    progressable: (state = region_state(region, args)) && derive_state(state, region.can_progress(args)),
                    ..._.pick(region, 'prize', 'medallion')
                });
                return { items,
                    dungeons: {
                        eastern: dungeon(world.eastern, { ...args, region: world.eastern }),
                        desert: dungeon(world.desert, { ...args, region: world.desert }),
                        hera: dungeon(world.hera, { ...args, region: world.hera }),
                        darkness: dungeon(world.darkness, { ...args, region: world.darkness }),
                        swamp: dungeon(world.swamp, { ...args, region: world.swamp }),
                        skull: dungeon(world.skull, { ...args, region: world.skull }),
                        thieves: dungeon(world.thieves, { ...args, region: world.thieves }),
                        ice: dungeon(world.ice, { ...args, region: world.ice }),
                        mire: dungeon(world.mire, { ...args, region: world.mire }),
                        turtle: dungeon(world.turtle, { ...args, region: world.turtle })
                    }, encounters: {
                        castle_tower: {
                            completable: (state = region_state(castle_tower, args)) &&
                                derive_state(state, castle_tower.can_complete(args))
                        }
                    }, lightworld: {
                        ..._.mapValues(lightworld_deathmountain_west.locations, location =>
                            (state = region_state(lightworld_deathmountain_west, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(lightworld_deathmountain_east.locations, location =>
                            (state = region_state(lightworld_deathmountain_east, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(lightworld_northwest.locations, location =>
                            (state = region_state(lightworld_northwest, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(lightworld_northeast.locations, location =>
                            (state = region_state(lightworld_northeast, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(lightworld_south.locations, location =>
                            (state = region_state(lightworld_south, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(castle_escape.locations, location =>
                            (state = region_state(castle_escape, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args)))
                    }, darkworld: {
                        ..._.mapValues(darkworld_deathmountain_west.locations, location =>
                            (state = region_state(darkworld_deathmountain_west, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(darkworld_deathmountain_east.locations, location =>
                            (state = region_state(darkworld_deathmountain_east, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(darkworld_northwest.locations, location =>
                            (state = region_state(darkworld_northwest, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(darkworld_northeast.locations, location =>
                            (state = region_state(darkworld_northeast, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(darkworld_south.locations, location =>
                            (state = region_state(darkworld_south, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args))),
                        ..._.mapValues(darkworld_mire.locations, location =>
                            (state = region_state(darkworld_mire, args)) &&
                                derive_state(state, !location.can_access || location.can_access(args)))
                    }
                };
            },
            toggle_item(name) {
                items = update(items, update.toggle(name));
            },
            raise_item(name) {
                const value = level(items[name], items.limit[name], 1);
                items = update(items, { [name]: { $set: value } });
            },
            lower_item(name) {
                const value = level(items[name], items.limit[name], -1);
                items = update(items, { [name]: { $set: value } });
            },
            toggle_completion(region) {
                world = update(world, { [region]: update.toggle('completed') });
            },
            raise_prize(region) {
                const value = level_symbol(world[region].prize, prizes, 1);
                world = update(world, { [region]: { prize: { $set: value } } });
            },
            lower_prize(region) {
                const value = level_symbol(world[region].prize, prizes, -1);
                world = update(world, { [region]: { prize: { $set: value } } });
            },
            raise_medallion(region) {
                const value = level_symbol(world[region].medallion, medallions, 1);
                world = update(world, { [region]: { medallion: { $set: value } } });
            },
            lower_medallion(region) {
                const value = level_symbol(world[region].medallion, medallions, -1);
                world = update(world, { [region]: { medallion: { $set: value } } });
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

    const level = (value, limit, delta) => {
        const [max, min] = limit[0] ? limit : [limit, 0];
        const modulo = max-min+1;
        return (value-min + modulo + delta) % modulo + min;
    };

    const level_symbol = (value, symbols, delta) => {
        const modulo = symbols.length;
        const index = symbols.indexOf(value);
        return symbols[(index + modulo + delta) % modulo];
    };

    return create_model;
}));
