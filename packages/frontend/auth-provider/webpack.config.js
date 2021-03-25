
const path = require('path')


module.exports = {
    entry: './src/index.tsx',
    mode: 'production',
    module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
        ]
      },
    resolve: {
        extensions: ['.ts', '.tsx']
    },
    output: {
      filename: 'index.js',
      libraryTarget: 'umd',
      path: path.resolve(__dirname, 'lib')
    },
    externals: {
      'react': 'react'
    }
  }