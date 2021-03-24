
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const isDevelopment = process.env.NODE_ENV === 'development'


module.exports = {
    entry: './src/index.ts',
    mode: 'production',
    module: {
        rules: [
          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
          },
          {
            test: /\.module\.s(a|c)ss$/,
            loader: [            
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        modules: true,
                      }
                },
                {
                  loader: 'sass-loader',
                  options: {
                    sassOptions: {
                      includePaths: ["src/styles"],
                    }
                  }
                }
            ]
          },
         {
           test: /\.s(a|c)ss$/,
           exclude: /\.module.(s(a|c)ss)$/,
           loader: [
             MiniCssExtractPlugin.loader,
             'css-loader',
             {
               loader: 'sass-loader'
             }
           ]
         }
          
        ]
      },
    plugins: [      
      new MiniCssExtractPlugin({
        filename: '[name].css',
        chunkFilename: '[id].css',
      })
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.scss']
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