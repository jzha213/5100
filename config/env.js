// 环境配置
// 使用方法：
// 1. 本地开发时，将 ENV 改为 'dev'，baseURL 改为本地地址
// 2. 真机调试和上传体验版前，将 ENV 改为 'prod'，baseURL 改为线上地址（HTTPS）

// 手动切换环境：'dev' 本地开发 | 'prod' 线上环境（真机调试必须使用 prod）
const ENV = 'prod'; // 本地开发时改为 'dev'，真机调试和上传体验版前改回 'prod'

const configs = {
  dev: {
    // 本地开发环境
    // 注意：真机调试时需要使用电脑的局域网 IP，不能使用 localhost
    // 查看本机 IP：Windows 命令行执行 ipconfig，找到 IPv4 地址
    baseURL: 'http://192.168.1.158:8000', // 替换为你的本地 IP
  },
  prod: {
    // 生产环境（体验版和正式版）
    baseURL: 'https://www.santaikeji.top',
  }
};

const config = configs[ENV] || configs.prod;
config.env = ENV;

module.exports = config;


