const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const { extendDefaultPlugins } = require('svgo');
const glob = require('glob');
const PurgecssPlugin = require('purgecss-webpack-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

// Temporary workaround for 'browserslist' bug that is being patched in the near future
// Fix problem web-dev-server webpack 5
const target = process.env.NODE_ENV === 'production' ? 'browserslist' : 'web';

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: 'all'
    }
  };

  if (isProd) {
    config.minimizer = [new CssMinimizerPlugin(), new TerserWebpackPlugin()];
  }

  return config;
};

const filename = (ext) => (isDev ? `[name].${ext}` : `[name].[fullhash].${ext}`);

const plugins = () => {
  const base = [
    new HTMLWebpackPlugin({
      template: './index.html',
      minify: {
        collapseWhitespace: isProd
      }
    }),
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/img/icon'),
          to: path.resolve(__dirname, 'dist/img/icon')
        },
        {
          from: path.resolve(__dirname, 'src/other'),
          to: path.resolve(__dirname, 'dist/other')
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: `./css/${filename('css')}`
    }),
    new PurgecssPlugin({
      paths: () => glob.sync('./src/**/*.html', { nodir: true })
    })
  ];

  if (isProd) {
    base.push(
      new ImageMinimizerPlugin({
        minimizerOptions: {
          plugins: [
            ['gifsicle', { interlaced: true }],
            ['jpegtran', { progressive: true }],
            ['optipng', { optimizationLevel: 5 }],
            [
              'svgo',
              {
                plugins: extendDefaultPlugins([
                  {
                    name: 'removeViewBox',
                    active: false
                  }
                ])
              }
            ]
          ]
        }
      }),
      // // Enables BundleAnalyzer on build
      // new BundleAnalyzerPlugin()
    );
  }

  return base;
};

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: {
    main: ['./js/index.js']
    // example: "./js/example.js",
  },
  output: {
    filename: `./js/${filename('js')}`,
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  resolve: {
    // // We write extensions so as not to add .file to index js
    extensions: ['.js', '.json', '.xml', '.csv', '.png', '.svg', '.jpg', '.jpeg', '.css', '.sass', '.scss'],
    alias: {
      // // We make a short command
      '@models': path.resolve(__dirname, 'src/models'),
      '@': path.resolve(__dirname, 'src')
    }
  },
  optimization: optimization(),
  // // Fix problem web-dev-server webpack 5
  target: target,
  // // Setting localhost
  devServer: {
    contentBase: "./dist",
    open: true,
  },
  plugins: plugins(),
  // // Add source map on development
  devtool: isProd ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.(s[ac]|c)ss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'group-css-media-queries-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: `./img/${filename('[ext]')}`
            }
          }
        ]
      },
      {
        test: /\.(ttf|woff|woff2|eot)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: `./fonts/${filename('[ext]')}`
            }
          }
        ]
      },
      {
        test: /\.xml$/,
        use: ['xml-loader']
      },
      {
        test: /\.csv$/,
        use: ['csv-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          // without additional settings, this will reference .babelrc
          loader: 'babel-loader'
        }
      }
    ]
  }
};
