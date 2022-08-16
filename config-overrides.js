/* config-overrides.js */

module.exports = function override(config, env) {
    return {
        ...config,
        resolve: {
            ...config.resolve,
            fallback: {
                ...config.resolve.fallback,
                path: false,
            },
        },
    }
}
