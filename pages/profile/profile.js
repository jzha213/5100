const auth = require('../../services/auth');

Page({
  data: { 
    user: null 
  },
  
  async onShow() {
    // 先检查是否有 token，避免未登录时调用需要认证的 API
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ user: null });
      return;
    }
    
    try { 
      const user = await auth.profile();
      this.setData({ user }); 
    }
    catch(e) { 
      // 如果是认证错误（401），静默处理
      if (e.statusCode === 401 || e.isAuthError || e.silent || (e.data && (e.data.message && e.data.message.includes('需要重新登录') || e.data.message && e.data.message.includes('access_token')))) {
        // 静默清除 token，不显示错误信息
        try {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
        } catch (clearError) {
          // 忽略清除错误
        }
      }
      // 静默设置用户为 null，不显示任何错误信息
      this.setData({ user: null }); 
    }
  },
  
  toLogin() { 
    wx.navigateTo({ url: '/pages/login/login' }); 
  },
  
  toRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },
  
  toMyInfo() {
    console.log('点击我的信息按钮');
    try {
      wx.navigateTo({ 
        url: '/pages/profile/info/info',
        success: () => {
          console.log('跳转到我的信息页面成功');
        },
        fail: (error) => {
          console.error('跳转失败:', error);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('跳转异常:', error);
      wx.showToast({
        title: '跳转异常',
        icon: 'none'
      });
    }
  },
  
  toAddress() { 
    wx.navigateTo({ url: '/pages/address/list/list' }); 
  },
  
  toOrders() { 
    wx.navigateTo({ url: '/pages/order/list/list' }); 
  },
  
  // 退出登录功能
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          this.performLogout();
        }
      }
    });
  },
  
  // 执行退出登录操作
  async performLogout() {
    // 直接清除所有数据，不需要等待任何异步操作
    try {
      // 清除本地存储（静默处理，不抛出错误）
      try {
        wx.removeStorageSync('token');
      } catch (e) {
        // 忽略错误
      }
      
      try {
        wx.removeStorageSync('access_token');
      } catch (e) {
        // 忽略错误
      }
      
      try {
        wx.removeStorageSync('userInfo');
      } catch (e) {
        // 忽略错误
      }
      
      // 清除全局数据
      try {
        const app = getApp();
        if (app.globalData) {
          app.globalData.userInfo = null;
          app.globalData.token = null;
          app.globalData.checkoutItems = [];
        }
      } catch (e) {
        // 忽略错误
      }
      
      // 更新页面状态
      try {
        this.setData({ user: null });
      } catch (e) {
        // 忽略错误
      }
      
    } catch (error) {
      // 即使出错，也不显示错误信息
      // 清除操作应该始终静默执行
    }
    
    // 显示提示并跳转（即使清除过程中有错误，也要执行）
    try {
      wx.showToast({
        title: '已退出登录',
        icon: 'success',
        duration: 1500
      });
      
      // 延迟跳转到首页
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 1500);
    } catch (e) {
      // 如果显示提示失败，直接跳转
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' });
      }, 100);
    }
  }
});

