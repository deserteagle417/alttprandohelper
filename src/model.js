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
    const prizes = ['unknown', 'pendant-green', 'pendant', 'crystal', 'crystal-red'];
    const medallions = ['unknown', 'bombos', 'ether', 'quake'];

    const create_model = (mode) => {
        let world = create_world(mode).world;
        let items = create_items().items;
        return {
            state() {
                const args = { items, world, mode };
                const derive_state = (region, args, location) => {
                    region = !region.can_enter || region.can_enter(args) ||
                        !!region.can_enter_dark && region.can_enter_dark(args) && 'dark';
                    // respects dark higher, but possible/viewable highest
                    return region && (location =>
                        region === true ? location :
                        location === true ? region :
                        location
                    )(location(args));
                };
                const dungeons = (...dungeons) =>
                    _.mapValues(_.pick(world, dungeons), region => ({
                        completable: region.completed ? 'marked' : derive_state(region, { ...args, region }, region.can_complete),
                        progressable: !region.chests ? 'marked' : derive_state(region, { ...args, region }, region.can_progress),
                        ..._.pick(region, 'chests', 'prize', 'medallion', 'keys')
                    }));
                const overworld = (...regions) =>
                    _.assign(..._.map(_.pick(world, regions), region => ({
                        ..._.mapValues(region.locations, location => location.marked ? 'marked' :
                            derive_state(region, { ...args, region }, args => !location.can_access || location.can_access(args)))
                    })));
                return _.pickBy({
                    items,
                    dungeons: dungeons(
                        'eastern', 'desert', 'hera', 'darkness', 'swamp',
                        'skull', 'thieves', 'ice', 'mire', 'turtle'),
                    encounters: {
                        castle_tower: { completable: derive_state(world.castle_tower, args, world.castle_tower.can_complete) }
                    },
                    lightworld: overworld(
                        'lightworld_deathmountain_west',
                        'lightworld_deathmountain_east',
                        'lightworld_northwest',
                        'lightworld_northeast',
                        'lightworld_south',
                        'castle_escape'),
                    darkworld: overworld(
                        'darkworld_deathmountain_west',
                        'darkworld_deathmountain_east',
                        'darkworld_northwest',
                        'darkworld_northeast',
                        'darkworld_south',
                        'darkworld_mire'),
                    ganon_tower: mode.keysanity && world.ganon_tower
                });
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
            toggle_big_key(region) {
                world = update(world, { [region]: update.toggle('big_key') });
            },
            raise_key(region) {
                const { keys, key_limit } = world[region];
                const value = level(keys, key_limit, 1);
                world = update(world, { [region]: { keys: { $set: value } } });
            },
            lower_key(region) {
                const { keys, key_limit } = world[region];
                const value = level(keys, key_limit, -1);
                world = update(world, { [region]: { keys: { $set: value } } });
            },
            raise_chest(region) {
                const { chests, chest_limit } = world[region];
                const value = level(chests, chest_limit, 1);
                world = update(world, { [region]: { chests: { $set: value } } });
            },
            lower_chest(region) {
                const { chests, chest_limit } = world[region];
                const value = level(chests, chest_limit, -1);
                world = update(world, { [region]: { chests: { $set: value } } });
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
            toggle_overworld_mark(region, name) {
                world = update(world, { [region]: { locations: { [name]: update.toggle('marked') } } });
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
