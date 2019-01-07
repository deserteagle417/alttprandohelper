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
                    lightworld_south,
                    darkworld_deathmountain_west,
                    darkworld_deathmountain_east,
                    darkworld_northwest,
                    darkworld_northeast,
                    darkworld_south,
                    darkworld_mire
                } = world;
                const have_lightworld_deathmountain_west_can_enter = !!lightworld_deathmountain_west.can_enter;
                const have_lightworld_deathmountain_east_can_enter = !!lightworld_deathmountain_east.can_enter;
                const have_lightworld_northwest_can_enter = !!lightworld_northwest.can_enter;
                const have_lightworld_northeast_can_enter = !!lightworld_northeast.can_enter;
                const have_lightworld_south_can_enter = !!lightworld_south.can_enter;
                const have_darkworld_deathmountain_west_can_enter = !!darkworld_deathmountain_west.can_enter;
                const have_darkworld_deathmountain_east_can_enter = !!darkworld_deathmountain_east.can_enter;
                const have_darkworld_northwest_can_enter = !!darkworld_northwest.can_enter;
                const have_darkworld_northeast_can_enter = !!darkworld_northeast.can_enter;
                const have_darkworld_south_can_enter = !!darkworld_south.can_enter;
                const have_darkworld_mire_can_enter = !!darkworld_mire.can_enter;
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
            }
        }
    };

    return create_model;
}));
