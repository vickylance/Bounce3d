const path = require("path");
const webpack = require("webpack");
const merge = require("webpack-merge");
const HtmlWebPackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const common = require("./webpack.config.base.js");

console.log("WEBPACK BUILDING FOR PRODUCTION");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
        extractComments: true
      })
    ],
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          chunks: "initial",
          name: "vendor",
          enforce: true
        }
      }
    },
    // splitChunks: {
    //   cacheGroups: {
    //     commons: {
    //       test: /[\\/]node_modules[\\/]/,
    //       name: "common",
    //       chunks: "all"
    //     }
    //   }
    // }
  },
  output: {
    filename: "bundle.[contenthash].js",
    path: path.resolve(__dirname, "docs")
  },
  plugins: [
    new HtmlWebPackPlugin({
      inject: true,
      template: "./src/index.html",
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    })
  ]
});
