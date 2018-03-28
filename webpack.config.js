const path = require('path');
const webpack = require('webpack');
const package = require('./package');

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
        }),
        new webpack.BannerPlugin(`Grapnel\n${package.repository.url}\n\n@author ${package.author}\n@link ${package.link}\n@version ${package.version}\n\nReleased under MIT License. See LICENSE.txt or http://opensource.org/licenses/MIT`)
    ]
}