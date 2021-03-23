
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
                        sourceMap: isDevelopment
                      }
                },
                {
                  loader: 'sass-loader',
                  options: {
                      sourceMap: isDevelopment
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
               loader: 'sass-loader',
               options: {
                 sourceMap: isDevelopment
               }
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
      path: path.resolve(__dirname, 'lib'),
    },
  }