const auth = require('../../services/auth');
const { processImageUrl } = require('../../utils/image');
const env = require('../../config/env');

Page({
  data: {
    username: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    phone: '',
    email: '',
    loading: false,
    defaultAvatarUrl: processImageUrl(null, '/static/assets/images/default-avatar.png')
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '用户注册'
    });
    
    // 设置默认头像URL
    this.setData({
      defaultAvatarUrl: processImageUrl(null, '/static/assets/images/default-avatar.png')
    });
  },

  // 输入事件处理
  onUsernameInput(e) {
    this.setData({ username: e.detail.value });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value });
  },

  // 表单验证
  validateForm() {
    const { username, password, confirmPassword, phone, email } = this.data;

    // 必填字段验证
    if (!username.trim()) {
      wx.showToast({ title: '请输入用户名', icon: 'none' });
      return false;
    }

    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return false;
    }

    if (!confirmPassword) {
      wx.showToast({ title: '请确认密码', icon: 'none' });
      return false;
    }

    if (!phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return false;
    }

    // 用户名格式验证（英文和数字）
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
      wx.showToast({ title: '用户名只能包含英文和数字', icon: 'none' });
      return false;
    }

    // 密码长度验证
    if (password.length < 6) {
      wx.showToast({ title: '密码至少需要6位', icon: 'none' });
      return false;
    }

    // 密码确认验证
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return false;
    }

    // 手机号格式验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      wx.showToast({ title: '请输入有效的手机号码', icon: 'none' });
      return false;
    }

    // 邮箱格式验证（如果填写）
    if (email && !/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email)) {
      wx.showToast({ title: '请输入有效的邮箱地址', icon: 'none' });
      return false;
    }

    return true;
  },

  // 注册功能
  async register() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ loading: true });
    wx.showLoading({ title: '注册中...' });

    try {
      const { username, nickname, password, confirmPassword, phone, email } = this.data;
      
      const registerData = {
        username: username.trim(),
        nickname: nickname.trim() || username.trim(), // 如果没有填写昵称，使用用户名
        password: password,
        password_confirm: confirmPassword,
        phone: phone.trim(),
        email: email.trim() || undefined // 如果邮箱为空，不发送该字段
      };

      console.log('提交注册数据:', registerData);

      // 调用注册API
      const res = await auth.register(registerData);
      console.log('注册成功响应:', res);

      wx.hideLoading();
      wx.showToast({ 
        title: '注册成功', 
        icon: 'success',
        duration: 2000
      });

      // 注册成功后跳转到登录页面，并携带用户名
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/login/login?username=${encodeURIComponent(username)}`
        });
      }, 2000);

    } catch (error) {
      wx.hideLoading();
      this.setData({ loading: false });
      console.error('注册失败:', error);
      
      let errorMessage = '注册失败，请稍后再试';
      
      // 处理后端返回的错误信息
      if (error.data) {
        if (error.data.username) {
          errorMessage = '用户名: ' + error.data.username[0];
        } else if (error.data.phone) {
          errorMessage = '手机号: ' + error.data.phone[0];
        } else if (error.data.email) {
          errorMessage = '邮箱: ' + error.data.email[0];
        } else if (error.data.password) {
          errorMessage = '密码: ' + error.data.password[0];
        } else if (error.data.non_field_errors) {
          errorMessage = error.data.non_field_errors[0];
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      wx.showToast({ 
        title: errorMessage, 
        icon: 'none', 
        duration: 3000 
      });
    }
  },

  // 跳转到登录页面
  toLogin() {
    wx.redirectTo({
      url: '/pages/login/login'
    });
  }
});
