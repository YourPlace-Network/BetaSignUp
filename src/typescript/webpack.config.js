const path = require('path');
const webpack = require('webpack');

// https://stevenwestmoreland.com/2018/01/how-to-include-bootstrap-in-your-project-with-webpack.html

module.exports = {
    context: path.resolve(__dirname, ''),
    devtool: 'inline-source-map',
    entry: {
        //global: './global.ts',
        home: './pages/home.ts',
        success: './pages/success.ts',
        failure: './pages/failure.ts',
    },
    mode: 'development',
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            include: path.resolve(__dirname, "."),
            exclude: /node_modules/,
        },{
            test: /\.(scss)$/,
            include: path.resolve(__dirname, "../scss"),
            use: [{
                loader: 'style-loader'  // Adds CSS to the DOM by injecting a `<style>` tag
            },{
                loader: 'css-loader',  // Interprets `@import` and `url()` like `import/require()` and will resolve them
                options: {
                    sourceMap: false,
                }
            },{
                loader: 'postcss-loader',  // Loader for webpack to process CSS with PostCSS
                options: {
                    postcssOptions: {
                        plugins: [
                            ["autoprefixer", {}]
                        ]
                    }
                }
            },{
                loader: 'sass-loader',  // Loads a SASS/SCSS file and compiles it to CSS
                options: {
                    sourceMap: false,
                    sassOptions: {
                        fiber: false,
                        outputStyle: "compressed",
                    }
                }
            }]
        }]
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../www/js/')
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
        fallback: {
            "crypto": require.resolve("crypto-browserify"),
            "stream": require.resolve("stream-browserify"),
            buffer: require.resolve("buffer/"),
            util: require.resolve("util/"),
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: "process/browser",
        }),
    ],
    experiments: {
        topLevelAwait: true,
    },
    ignoreWarnings: [{
        message: /print-color-adjust/,
    }]
};