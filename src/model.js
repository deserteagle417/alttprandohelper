(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.update = factory();
    }
}(typeof self !== 'undefined' ? self : this, function() {
    const create_model = () => {
        return {
            state() {
                return { lightworld: { mushroom: true } };
            }
        }
    };

    return create_model;
}));
