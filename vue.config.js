const path = require('path')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin')
const isProduct = process.env.NODE_ENV === 'production'

function resolve(dir) {
  return path.join(__dirname, dir)
}

const port = process.env.port || process.env.npm_config_port || 8080 //  npm run dev --port = 9527 可通过这个命令更改端口号

module.exports = {
  lintOnSave: false,
  publicPath: '/', // 基本路径
  outputDir: 'dist', // 构建时的输出目录
  assetsDir: 'static', // 放置静态资源的目录
  // 如果不需要生产环境的sourcemap 可以设置为false加快构建 既可以减少包大小，也可以加密源码。
  productionSourceMap: false,
  // transpileDependencies: [/[/\\]node_modules[/\\].*/], // polyfill
  devServer: {
    disableHostCheck: true,
    port: port,
    open: true, // 启动项目时自动打开浏览器
    // before: require('./mock/mock-server.js'),
    overlay: {
      // 浏览器日志
      warnings: false,
      errors: true
    },
    proxy: {
      /* 代理地址二 */
      [process.env.VUE_APP_BASE_API_TWO]: {
        target: process.env.VUE_APP_BASE_URL_TWO,
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API_TWO]: '' // 这里理解成用'/api'代替target里面的地址,比如我要调用'http://40.00.100.100:3002/user/add'，直接写'/api/user/add'即可
        }
      },
      /* 代理地址三 */
      [process.env.VUE_APP_BASE_API_THREE]: {
        target: process.env.VUE_APP_BASE_URL_THREE,
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API_THREE]: '' // 这里理解成用'/api'代替target里面的地址,比如我要调用'http://40.00.100.100:3002/user/add'，直接写'/api/user/add'即可
        }
      },
      /* 代理地址一 */
      [process.env.VUE_APP_BASE_API]: {
        target: process.env.VUE_APP_BASE_URL /* 目标代理服务器地址 */,
        changeOrigin: true /* 允许跨域 */,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: '' // 这里理解成用'/api'代替target里面的地址,比如我要调用'http://40.00.100.100:3002/user/add'，直接写'/api/user/add'即可
        }
      }
    }
  },
  css: {
    requireModuleExtension: true,
    loaderOptions: {
      sass: {
        prependData: '@import "~@/styles/variables.scss";'
      }
    }
  },
  chainWebpack(config) {
    if (isProduct) {
      // 打包loader耗时分析
      config.plugin('speed').use(SpeedMeasurePlugin)
      // 打包文件大小分析
      // config
      //   .plugin('webpack-bundle-analyzer')
      //   .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin)
    }
    // 别名
    config.resolve.alias.set('@', resolve('src')).set('@img', resolve('src/assets/img'))
    // source-map
    config.when(process.env.NODE_ENV === 'development', (config) =>
      config.devtool('cheap-source-map')
    )
    // 修改loader
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4000,
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash:6].[ext]'
          }
        }
      })
    // 代码优化
    config.optimization
      // 代码切割
      .splitChunks({
        chunks: 'all', // async对异步引入的代码分割 initial对同步引入代码分割 all对同步异步引入的分割都开启
        minSize: 1024 * 30, // 字节 引入的文件大于30kb才进行分割
        // maxSize: 1024 * 80, // 尝试将大于80kb的文件拆分成n个80kb的文件
        minChunks: 1, // 模块至少使用次数
        maxAsyncRequests: 5, // 同时加载的模块数量最多是5个，只分割出同时引入的前5个文件（按需加载模块）
        maxInitialRequests: 3, // 首页加载的时候引入的文件最多3个（加载初始页面）
        automaticNameDelimiter: '~', // 缓存组和生成文件名称之间的连接符
        name: true, // 缓存组里面的filename生效，覆盖默认命名
        cacheGroups: {
          // 缓存组，将所有加载模块放在缓存里面一起分割打包
          vendors: {
            name: 'vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 0,
            chunks: 'initial' // only package third parties that are initially dependent
          },
          elementPlus: {
            name: 'elementPlus', // split elementPlus into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?element-plus(.*)/ // in order to adapt to cnpm
          },
          echarts: {
            name: 'echarts', // split elementUI into a single package
            priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
            test: /[\\/]node_modules[\\/]_?echarts(.*)/ // in order to adapt to cnpm
          },
          components: {
            name: 'components',
            test: path.resolve(__dirname, 'src/components'),
            minChunks: 2, //  minimum common number
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
      .runtimeChunk({
        name: 'runtime'
      })
  },
  configureWebpack: () => {
    const option = {
      module: {
        rules: [
          {
            test: /\.mjs$/,
            include: /node_modules/,
            type: 'javascript/auto'
          }
        ]
      }
    }

    if (isProduct) {
      return Object.assign(option, {
        plugins: [
          new CompressionPlugin({
            test: /\.(js|css|html)?$/i, // 匹配文件名
            threshold: 10240, // 对超过10k的数据进行压缩
            deleteOriginalAssets: false, // 是否删除源文件
            minRatio: 0.9 // 压缩率小于0.9才会压缩
          }),
          new TerserPlugin({
            cache: true,
            sourceMap: false,
            parallel: true,
            terserOptions: {
              ecma: undefined,
              warnings: false,
              parse: {},
              compress: {
                drop_console: true,
                drop_debugger: false,
                pure_funcs: ['console.log'] // 线上去掉console
              }
            }
          })
        ]
      })
    } else {
      return Object.assign(option, {})
    }
  }
}
