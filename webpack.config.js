var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: {
        'grapnel': './build/index.js',
        'grapnel.min': './build/index.js'
    },
    output: {
        path: './dist',
        filename: '[name].js',
        library: 'Grapnel',
        libraryTarget: 'var'
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
            include: /\.min\.js$/,
            compress: { warnings: false }
        })
    ]
}