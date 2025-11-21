const orderService = require('../../../services/order');
const { getProductMainImage } = require('../../../utils/image');

Page({
  data:{ 
    id: null, 
    order: {},
    loading: true,
    error: false
  },
  
  onLoad(q){ 
    this.setData({ id: q.id }); 
    this.load(); 
  },
  
  async load(){
    // 先检查 token
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ 
        loading: false,
        error: true 
      });
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({ loading: true, error: false });
    try{ 
      const order = await orderService.detail(this.data.id); 
      console.log('订单详情数据:', order);
      
      // 处理订单数据，为每个商品添加主图URL
      const orderData = order.data || order;
      if (orderData.items && orderData.items.length > 0) {
        const processedItems = orderData.items.map(item => {
          console.log('处理订单商品:', item);
          console.log('商品图片URL:', item.product_image);
          
          // 直接使用product_image字段
          const mainImage = getProductMainImage(item);
          console.log('处理后的图片URL:', mainImage);
          
          return {
            ...item,
            mainImage: mainImage
          };
        });
        
        orderData.items = processedItems;
      }
      
      this.setData({ 
        order: orderData,
        loading: false 
      }); 
    }
    catch(e){ 
      console.error('加载订单详情失败:', e);
      
      // 如果是认证错误，静默处理
      if (e.statusCode === 401 || (e.data && e.data.message && (e.data.message.includes('需要重新登录') || e.data.message.includes('access_token')))) {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
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
        wx.showToast({ title:'加载失败', icon:'none' }); 
      }
      
      this.setData({ 
        error: true,
        loading: false 
      });
    }
  },

  // 删除订单
  async deleteOrder() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个订单吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });
            await orderService.delete(this.data.id);
            wx.hideLoading();
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 返回上一页或订单列表
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } catch (error) {
            console.error('删除订单失败:', error);
            wx.hideLoading();
            wx.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 支付订单
  payOrder() {
    wx.showModal({
      title: '支付订单',
      content: '支付功能暂未实现，请联系客服处理。',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});

