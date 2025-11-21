// 我的信息页面逻辑
const auth = require('../../../services/auth');
const { getUserAvatar } = require('../../../utils/image');
const env = require('../../../config/env');

Page({
  data: {
    userInfo: {
      username: '',
      nickname: '',
      avatar_url: '',
      email: '',
      phone: ''
    },
    passwordForm: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    saving: false,
    usernameError: '',
    passwordError: '',
    emailError: '',
    phoneError: '',
    defaultAvatarUrl: `${env.baseURL}/static/assets/images/default-avatar.png`
  },

  // 页面加载
  async onLoad() {
    await this.loadUserInfo();
  },

  // 加载用户信息
  async loadUserInfo() {
    // 先检查是否有 token
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      // 延迟返回登录页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    try {
      const userInfo = await auth.profile();
      console.log('用户信息:', userInfo);
      
      this.setData({
        userInfo: {
          username: userInfo.username || '',
          nickname: userInfo.nickname || '',
          avatar_url: getUserAvatar(userInfo.avatar_url),
          email: userInfo.email || '',
          phone: userInfo.phone || ''
        }
      });
    } catch (error) {
      console.error('加载用户信息失败:', error);
      
      // 如果是认证错误，跳转到登录页
      if (error.statusCode === 401 || (error.data && error.data.message && (error.data.message.includes('需要重新登录') || error.data.message.includes('access_token')))) {
        wx.showToast({
          title: '登录已过期，请重新登录',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }, 1500);
      } else {
        wx.showToast({
          title: '加载用户信息失败',
          icon: 'none'
        });
      }
    }
  },

  // 用户名输入
  onUsernameInput(e) {
    const username = e.detail.value;
    this.setData({
      'userInfo.username': username,
      usernameError: ''
    });
    
    // 实时验证用户名格式
    this.validateUsername(username);
  },

  // 验证用户名格式
  validateUsername(username) {
    if (!username) return;
    
    // 检查是否包含中文或特殊字符
    const englishNumberRegex = /^[a-zA-Z0-9]+$/;
    if (!englishNumberRegex.test(username)) {
      this.setData({
        usernameError: '此账号包含非法字符，只能使用英文和数字'
      });
      return false;
    }
    
    // 检查长度
    if (username.length < 3) {
      this.setData({
        usernameError: '账号长度不能少于3位'
      });
      return false;
    }
    
    this.setData({ usernameError: '' });
    return true;
  },

  // 原密码输入
  onOldPasswordInput(e) {
    this.setData({
      'passwordForm.oldPassword': e.detail.value,
      passwordError: ''
    });
  },

  // 新密码输入
  onNewPasswordInput(e) {
    this.setData({
      'passwordForm.newPassword': e.detail.value,
      passwordError: ''
    });
  },

  // 确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      'passwordForm.confirmPassword': e.detail.value,
      passwordError: ''
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickname': e.detail.value
    });
  },

  // 选择头像
  chooseAvatar() {
    const that = this;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePath = res.tempFilePaths[0];
        console.log('选择的头像文件:', tempFilePath);
        
        // 显示上传进度
        wx.showLoading({
          title: '上传中...',
          mask: true
        });
        
        // 上传头像到服务器
        that.uploadAvatar(tempFilePath);
      },
      fail: function(error) {
        console.error('选择头像失败:', error);
        wx.showToast({
          title: '选择头像失败',
          icon: 'none'
        });
      }
    });
  },

  // 上传头像到服务器
  async uploadAvatar(filePath) {
    try {
      const uploadResult = await this.uploadFile(filePath);
      console.log('头像上传成功:', uploadResult);
      
      // 更新用户信息中的头像URL，使用头像处理函数
      const processedUrl = getUserAvatar(uploadResult.url);
      
      this.setData({
        'userInfo.avatar_url': processedUrl
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '头像上传成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('头像上传失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '头像上传失败',
        icon: 'none'
      });
    }
  },

  // 上传文件到服务器
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      console.log('当前token:', token);
      
      if (!token) {
        reject(new Error('用户未登录，请先登录'));
        return;
      }
      
      wx.uploadFile({
        url: `${env.baseURL}/api/v1/auth/upload/avatar/`,
        filePath: filePath,
        name: 'avatar',
        header: {
          'Authorization': `Bearer ${token}`
        },
        success: function(res) {
          console.log('上传响应:', res);
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data.data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (e) {
            reject(new Error('解析响应失败'));
          }
        },
        fail: function(error) {
          console.error('上传失败:', error);
          reject(error);
        }
      });
    });
  },

  // 清除头像
  clearAvatar() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除当前头像吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'userInfo.avatar_url': ''
          });
          wx.showToast({
            title: '头像已清除',
            icon: 'success'
          });
        }
      }
    });
  },

  // 邮箱输入
  onEmailInput(e) {
    const email = e.detail.value;
    this.setData({
      'userInfo.email': email,
      emailError: ''
    });
    
    // 实时验证邮箱格式
    this.validateEmail(email);
  },

  // 验证邮箱格式
  validateEmail(email) {
    if (!email) return true;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.setData({
        emailError: '邮箱格式不正确'
      });
      return false;
    }
    
    this.setData({ emailError: '' });
    return true;
  },

  // 手机号输入
  onPhoneInput(e) {
    const phone = e.detail.value;
    this.setData({
      'userInfo.phone': phone,
      phoneError: ''
    });
    
    // 实时验证手机号格式
    this.validatePhone(phone);
  },

  // 验证手机号格式
  validatePhone(phone) {
    if (!phone) return true;
    
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      this.setData({
        phoneError: '手机号格式不正确'
      });
      return false;
    }
    
    this.setData({ phoneError: '' });
    return true;
  },

  // 保存信息
  async saveInfo() {
    if (this.data.saving) return;
    
    // 验证所有输入
    if (!this.validateAllInputs()) {
      return;
    }
    
    this.setData({ saving: true });
    
    try {
      // 准备更新数据
      const updateData = {
        username: this.data.userInfo.username,
        nickname: this.data.userInfo.nickname,
        avatar_url: this.data.userInfo.avatar_url,
        email: this.data.userInfo.email,
        phone: this.data.userInfo.phone
      };
      
      // 如果有密码修改，添加密码字段
      if (this.data.passwordForm.oldPassword && this.data.passwordForm.newPassword) {
        updateData.old_password = this.data.passwordForm.oldPassword;
        updateData.new_password = this.data.passwordForm.newPassword;
      }
      
      console.log('更新用户信息:', updateData);
      
      // 调用API更新用户信息
      await auth.updateProfile(updateData);
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 清空密码表单
      this.setData({
        passwordForm: {
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      });
      
    } catch (error) {
      console.error('保存用户信息失败:', error);
      
      // 处理特定错误
      if (error.message && error.message.includes('账号已被使用')) {
        this.setData({
          usernameError: '此账号已被使用，请更换一个'
        });
      } else if (error.message && error.message.includes('原密码错误')) {
        this.setData({
          passwordError: '原密码输入错误'
        });
      } else {
        wx.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        });
      }
    } finally {
      this.setData({ saving: false });
    }
  },

  // 验证所有输入
  validateAllInputs() {
    let isValid = true;
    
    // 验证用户名
    if (!this.validateUsername(this.data.userInfo.username)) {
      isValid = false;
    }
    
    // 验证邮箱
    if (this.data.userInfo.email && !this.validateEmail(this.data.userInfo.email)) {
      isValid = false;
    }
    
    // 验证手机号
    if (this.data.userInfo.phone && !this.validatePhone(this.data.userInfo.phone)) {
      isValid = false;
    }
    
    // 验证密码
    if (this.data.passwordForm.oldPassword || this.data.passwordForm.newPassword) {
      if (!this.data.passwordForm.oldPassword) {
        this.setData({
          passwordError: '请输入原密码'
        });
        isValid = false;
      } else if (!this.data.passwordForm.newPassword) {
        this.setData({
          passwordError: '请输入新密码'
        });
        isValid = false;
      } else if (this.data.passwordForm.newPassword !== this.data.passwordForm.confirmPassword) {
        this.setData({
          passwordError: '两次输入的密码不一致'
        });
        isValid = false;
      } else if (this.data.passwordForm.newPassword.length < 6) {
        this.setData({
          passwordError: '新密码长度不能少于6位'
        });
        isValid = false;
      }
    }
    
    return isValid;
  },

  // 重置表单
  resetForm() {
    wx.showModal({
      title: '确认重置',
      content: '确定要重置所有修改吗？',
      success: (res) => {
        if (res.confirm) {
          this.loadUserInfo();
          this.setData({
            passwordForm: {
              oldPassword: '',
              newPassword: '',
              confirmPassword: ''
            },
            usernameError: '',
            passwordError: '',
            emailError: '',
            phoneError: ''
          });
        }
      }
    });
  }
});
