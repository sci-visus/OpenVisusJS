const pkg = require('./package.json');

module.exports = {
    mode: 'development',
    entry: "./src/concat.js",
    output: {
        filename: "index.js",
        path: __dirname + '/dist',
        library: pkg.name,
        libraryTarget: "commonjs2"
    },
    // Remove this section for production
    optimization: {
        minimize: false,
    }
};
