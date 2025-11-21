// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    checkoutItems: []
  },
  
  onError(msg, stack) {
    // 全局错误处理 - 捕获所有未处理的错误
    // 如果是认证相关的错误或微信系统错误，完全静默处理
    try {
      const errorMsg = msg ? String(msg) : '';
      const stackMsg = stack ? String(stack) : '';
      const fullMsg = (errorMsg + ' ' + stackMsg).toLowerCase();
      
      // 检查是否是应该静默处理的错误
      const shouldSilent = fullMsg && (
        // 我们自己的认证错误
        fullMsg.includes('需要重新登录') || 
        fullMsg.includes('access_token missing') || 
        fullMsg.includes('access_token') ||
        fullMsg.includes('清除登录状态失败') ||
        fullMsg.includes('清除登录') ||
        fullMsg.includes('认证') ||
        fullMsg.includes('401') ||
        fullMsg.includes('isautherror') ||
        fullMsg.includes('silent') ||
        // 微信系统错误
        fullMsg.includes('webapi_getwxaasyncsecinfo') ||
        fullMsg.includes('41001') ||
        fullMsg.includes('systemerror') ||
        fullMsg.includes('appservicesdkscripterror') ||
        fullMsg.includes('token') ||
        fullMsg.includes('unauthorized')
      );
      
      if (shouldSilent) {
        // 完全静默，不输出任何信息，不显示错误
        return;
      }
    } catch (e) {
      // 如果错误处理本身出错，也静默
      return;
    }
    
    // 其他错误正常处理
    try {
      console.error('[App Error]', msg, stack);
    } catch (e) {
      // 忽略日志输出错误
    }
  },
  
  onLaunch() {
    // 应用启动时，不执行任何需要认证的操作
    // 清除缓存时，这里不会被调用，所以不需要特殊处理
    
    // 捕获所有未处理的 Promise rejection
    // 在微信小程序中，我们需要通过全局错误处理来捕获
    // 已经在 onError 中处理了
  },
  
  onHide() {
    // 小程序隐藏时，不做任何操作，避免触发 API 调用
  },
  
  onShow() {
    // 小程序显示时，不做任何操作，避免触发 API 调用
    // 各个页面自己的 onShow 会处理自己的逻辑
  }
})
