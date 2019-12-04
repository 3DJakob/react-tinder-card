var path = require('path')

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    path: path.resolve('lib'),
    filename: 'ReactTinderCard.js',
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        use: 'babel-loader'
      }
    ]
  }
}
