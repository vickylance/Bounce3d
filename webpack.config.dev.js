
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebPackPlugin = require('html-webpack-plugin');

const common = require('./webpack.config.base.js');

console.log("WEBPACK BUILDING FOR DEVELOPMENT");

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    hot: true,
    compress: true
  },
  plugins: [
    new HtmlWebPackPlugin({
      inject: true,
      template: "./src/index.html",
    }),
    
  ]
});