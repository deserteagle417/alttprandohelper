(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./world'), require('lodash'));
    } else {
        root.update = factory(root.create_world, root._);
    }
}(typeof self !== 'undefined' ? self : this, function(create_world, _) {
    const open_mode_setting = {};
    const world = create_world(open_mode_setting).world;

    const create_model = () => {
        return {
            state() {
                const {
                    lightworld_deathmountain_west,
                    lightworld_deathmountain_east,
                    lightworld_northwest,
                    lightworld_northeast,
                    lightworld_south
                } = world;
                const have_lightworld_deathmountain_west_can_enter = !!lightworld_deathmountain_west.can_enter;
                const have_lightworld_deathmountain_east_can_enter = !!lightworld_deathmountain_east.can_enter;
                const have_lightworld_northwest_can_enter = !!lightworld_northwest.can_enter;
                const have_lightworld_northeast_can_enter = !!lightworld_northeast.can_enter;
                const have_lightworld_south_can_enter = !!lightworld_south.can_enter;
                return { lightworld: {
                    ..._.mapValues(lightworld_deathmountain_west.locations, location =>
                        !have_lightworld_deathmountain_west_can_enter && !location.can_access),
                    ..._.mapValues(lightworld_deathmountain_east.locations, location =>
                        !have_lightworld_deathmountain_east_can_enter && !location.can_access),
                    ..._.mapValues(lightworld_northwest.locations, location =>
                        !have_lightworld_northwest_can_enter && !location.can_access),
                    ..._.mapValues(lightworld_northeast.locations, location =>
                        !have_lightworld_northeast_can_enter && !location.can_access),
                    ..._.mapValues(lightworld_south.locations, location =>
                        !have_lightworld_south_can_enter && !location.can_access)
                } };
            }
        }
    };

    return create_model;
}));
