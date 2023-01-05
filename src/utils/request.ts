import axios from 'axios'
// import Vue from 'vue'
// var that = new Vue()
// import { Message } from "element-ui"; // MessageBox
import store from '@/store'
import { getToken } from '@/utils/auth'
// import qs from "qs";
// import { showLoading, hideLoading } from '@/components/loading/loading'

const service = axios.create({
  // baseURL: process.env.VUE_APP_BASE_URL, // url = base url + request url
  // withCredentials: true, // 跨域请求时发送Cookie
  timeout: 60000 // 请求超时间，毫秒
})

// request interceptor
service.interceptors.request.use(
  (config: any) => {
    console.log(process, process.env, process.env.VUE_APP_BASE_URL)
    // 在发送请求之前做些什么
    const { notShowLoading } = config.data || false
    // formData请求 config.data = qs.stringify(config.data); config.headers["Content-Type"] = "application/x-www-form-urlencoded";
    config.headers['Content-Type'] = 'application/json' // json请求
    if (store.getters.token) {
      // Date.parse(new Date()) 精确到秒的时间戳
      // new Date().getTime() 精确到毫秒的时间戳
      // process.env.VUE_APP_FLAG  配置的口令
      // (Math.random() * 1e16)  随机数
      config.headers.Authorization = getToken()
      // config.headers['time'] = new Date().getTime()
      // config.headers['random'] = Math.random() * 1e16
      // const sign = new Date().getTime() + Math.random() * 1e16 + process.env.VUE_APP_FLAG
      // config.headers['sign'] = that.$md5(sign).toUpperCase()
    }
    if (!notShowLoading) {
      // showLoading()
    }
    return config
  },
  (error) => {
    // 处理请求错误
    console.log(error) // 用于调试
    return Promise.reject(error)
  }
)
// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // hideLoading()
    const res = response.data
    if (res.status !== 0) {
      if (res.status === -401) {
        // that.$messagee(res.message)
      } else {
        // that.$messagee(res.message)
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    } else {
      return res
    }
  },
  (error) => {
    console.log('err' + error.response.status) // 用于调试
    // hideLoading()
    // that.$message.error(error.message)
    return Promise.reject(error)
  }
)

export default service
