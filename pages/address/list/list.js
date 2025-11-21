const addressService = require('../../../services/address');

Page({
  data: {
    items: [],
    loading: false
  },

  async onShow() {
    // 先检查是否有 token，避免未登录时调用需要认证的 API
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ 
        loading: false,
        items: []
      });
      return;
    }
    
    this.loadAddresses();
  },

  // 加载地址列表
  async loadAddresses() {
    // 再次检查 token（防止在调用过程中 token 被清除）
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ 
        loading: false,
        items: []
      });
      return;
    }
    
    this.setData({ loading: true });
    try {
      const response = await addressService.list();
      console.log('地址列表数据:', response);
      const items = response.data || response.results || response || [];
      this.setData({ 
        items: items,
        loading: false 
      });
    } catch (e) {
      console.error('加载地址失败:', e);
      
      // 如果是认证错误，静默处理
      if (e.statusCode === 401 || (e.data && e.data.message && (e.data.message.includes('需要重新登录') || e.data.message.includes('access_token')))) {
        // 清除过期的 token
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
      }
      
      this.setData({ loading: false });
      
      // 只有非认证错误才显示提示
      if (e.statusCode !== 401) {
        wx.showToast({ 
          title: '加载失败', 
          icon: 'none' 
        });
      }
    }
  },

  // 新增地址
  create() {
    wx.navigateTo({ 
      url: '/pages/address/edit/edit' 
    });
  },

  // 编辑地址
  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ 
      url: `/pages/address/edit/edit?id=${id}` 
    });
  },

  // 删除地址
  async deleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await addressService.remove(id);
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            // 重新加载地址列表
            this.loadAddresses();
          } catch (error) {
            console.error('删除地址失败:', error);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 设为默认地址
  async setDefault(e) {
    const id = e.currentTarget.dataset.id;
    
    try {
      // 获取当前地址信息
      const currentAddress = this.data.items.find(item => item.id == id);
      if (!currentAddress) {
        wx.showToast({
          title: '地址不存在',
          icon: 'none'
        });
        return;
      }

      // 更新地址为默认地址
      const updateData = {
        ...currentAddress,
        is_default: true
      };
      
      await addressService.update(id, updateData);
      
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      });
      
      // 重新加载地址列表
      this.loadAddresses();
    } catch (error) {
      console.error('设置默认地址失败:', error);
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      });
    }
  }
});

