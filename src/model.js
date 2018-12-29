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
                const can_access = world.lightworld_northwest.locations.mushroom.can_access;
                return { lightworld: { mushroom: !can_access } };
            }
        }
    };

    return create_model;
}));
