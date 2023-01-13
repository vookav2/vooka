/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path')
const dotenv = require('dotenv')

dotenv.config()

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const NodeExternalsPlugin = require('webpack-node-externals')

const isProduction = process.env.NODE_ENV === 'production'
const mode = isProduction ? 'production' : 'development'
const devtool = isProduction ? false : 'inline-source-map'

console.log(`Webpack running on ${mode}`)

module.exports = {
  context: __dirname,
  entry: ['./src/index.ts'],
  optimization: {
    nodeEnv: 'production',
    minimize: true,
    chunkIds: 'deterministic',
    concatenateModules: true,
    flagIncludedChunks: true,
    mangleExports: true,
    mangleWasmImports: true,
  },
  target: 'node',
  mode,
  devtool,
  externals: [NodeExternalsPlugin()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules|test/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin({
      async: !isProduction,
    }),
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
  },
}
