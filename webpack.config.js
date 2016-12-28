var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './dist/grapnel.js',
    output: {
        path: './dist',
        filename: 'grapnel.min.js'
    },
    devtool: 'source-map',
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                query: {
                    presets: [require.resolve('babel-preset-es2015')]
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compress: { warnings: false }
        })
    ]
}