const path = require('path');


module.exports = {
  "stories": [
      "../src/**/*.stories.mdx",
 //   "../stories/**/*.stories.mdx",   
 //   "../stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  webpackFinal: async (config, { configType }) => {
    // `configType` has a value of 'DEVELOPMENT' or 'PRODUCTION'
    // You can change the configuration based on that.
    // 'PRODUCTION' is used when building the static version of storybook.

    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        'style-loader', 
        { 
          loader: 'css-loader',
          options: {
            importLoaders: 1,
            modules: {
              localIdentName: '[name]_[local]_[hash:base64:5]'
            }            
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
      ],
      include: path.resolve(__dirname, '../'),
    });

    // Return the altered config
    return config;
  },
}