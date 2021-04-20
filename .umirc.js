var config = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['es2015']
          }
        }
      }
    ]
  },
  // set to development to read .env.local variables
  mode: 'development',
  target: 'web',
  externals: ["fs"]
}
module.exports = config;