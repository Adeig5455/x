import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import type { Configuration } from 'webpack';

const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const isBrowserDev = process.env.BROWSER_DEV === 'true';

const config: Configuration = {
  entry: './src/renderer/index.tsx',
  target: isBrowserDev ? 'web' : 'electron-renderer',
  output: {
    path: path.resolve(__dirname, 'dist/renderer'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@services': path.resolve(__dirname, 'src/services'),
    },
    fallback: isBrowserDev ? {
      path: require.resolve('path-browserify'),
      events: require.resolve('events/'),
      stream: false,
      fs: false,
      child_process: false,
      os: false,
      crypto: false,
    } : undefined,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
    }),
    new MonacoWebpackPlugin({
      languages: [
        'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp',
        'go', 'rust', 'html', 'css', 'json', 'markdown', 'yaml', 'sql',
      ],
    }),
    ...(isBrowserDev ? [
      new webpack.ProvidePlugin({
        global: ['window'],
        process: ['process/browser'],
      }),
    ] : []),
  ],
  devServer: {
    port: 3000,
    hot: true,
  },
};

export default config;
