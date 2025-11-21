const addressService = require('../../../services/address');
const regionUtils = require('../../../utils/region');

Page({
  data: {
    id: null,
    form: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      street: '',
      detail_address: '',
      is_default: false
    },
    loading: false,
    // 地区选择器数据
    provinces: [],
    cities: [],
    districts: [],
    provinceIndex: 0,
    cityIndex: 0,
    districtIndex: 0
  },

  onLoad(q) {
    this.initRegionData();
    if (q.id) {
      this.setData({ id: q.id });
      this.loadAddress();
    }
  },

  // 初始化地区数据
  initRegionData() {
    const provinces = regionUtils.getProvinces();
    this.setData({
      provinces: provinces
    });
  },

  // 加载地址详情（编辑模式）
  async loadAddress() {
    // 先检查 token
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    try {
      const address = await addressService.detail(this.data.id);
      console.log('地址详情:', address);
      this.setData({
        form: {
          name: address.name || '',
          phone: address.phone || '',
          province: address.province || '',
          city: address.city || '',
          district: address.district || '',
          street: address.street || '',
          detail_address: address.detail_address || '',
          is_default: address.is_default || false
        }
      });
    } catch (error) {
      console.error('加载地址失败:', error);
      
      // 如果是认证错误，静默处理
      if (error.statusCode === 401 || (error.data && error.data.message && (error.data.message.includes('需要重新登录') || error.data.message.includes('access_token')))) {
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
        wx.showToast({
          title: '加载地址失败',
          icon: 'none'
        });
      }
    }
  },

  // 输入框变化
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    // 确保输入的值是字符串，不是数组
    const stringValue = Array.isArray(value) ? value.join('') : String(value || '');
    this.setData({
      [`form.${field}`]: stringValue
    });
  },

  // 默认地址选择变化
  onDefaultChange(e) {
    this.setData({
      'form.is_default': e.detail.value
    });
  },

  // 省份选择变化
  onProvinceChange(e) {
    const index = e.detail.value;
    const province = this.data.provinces[index];
    const cities = regionUtils.getCities(province);
    
    this.setData({
      provinceIndex: index,
      'form.province': String(province || ''),
      cities: cities,
      districts: [],
      'form.city': '',
      'form.district': '',
      cityIndex: 0,
      districtIndex: 0
    });
  },

  // 城市选择变化
  onCityChange(e) {
    const index = e.detail.value;
    const city = this.data.cities[index];
    const districts = regionUtils.getDistricts(this.data.form.province, city);
    
    this.setData({
      cityIndex: index,
      'form.city': String(city || ''),
      districts: districts,
      'form.district': '',
      districtIndex: 0
    });
  },

  // 区县选择变化
  onDistrictChange(e) {
    const index = e.detail.value;
    const district = this.data.districts[index];
    
    this.setData({
      districtIndex: index,
      'form.district': String(district || '')
    });
  },

  // 表单验证
  validateForm() {
    const { name, phone, province, city, district, street, detail_address } = this.data.form;
    
    if (!name.trim()) {
      wx.showToast({ title: '请输入收货人姓名', icon: 'none' });
      return false;
    }
    
    if (!phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return false;
    }
    
    // 简单的手机号格式验证
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return false;
    }
    
    if (!province.trim()) {
      wx.showToast({ title: '请选择省份', icon: 'none' });
      return false;
    }
    
    if (!city.trim()) {
      wx.showToast({ title: '请选择城市', icon: 'none' });
      return false;
    }
    
    // 区县、街道、详细地址为选填，不进行必填验证
    
    return true;
  },

  // 保存地址
  async save() {
    if (!this.validateForm()) {
      return;
    }

    this.setData({ loading: true });
    
    try {
      // 确保所有字段都是字符串格式，避免数组格式
      const formData = {
        name: String(this.data.form.name || ''),
        phone: String(this.data.form.phone || ''),
        province: String(this.data.form.province || ''),
        city: String(this.data.form.city || ''),
        district: String(this.data.form.district || ''),
        street: Array.isArray(this.data.form.street) ? this.data.form.street.join('') : String(this.data.form.street || ''),
        detail_address: String(this.data.form.detail_address || ''),
        is_default: Boolean(this.data.form.is_default)
      };
      
      console.log('原始表单数据:', this.data.form);
      console.log('转换后的数据:', formData);
      console.log('street字段类型:', typeof formData.street, '值:', formData.street);
      
      if (this.data.id) {
        // 更新地址
        await addressService.update(this.data.id, formData);
        wx.showToast({ title: '更新成功', icon: 'success' });
      } else {
        // 创建地址
        await addressService.create(formData);
        wx.showToast({ title: '保存成功', icon: 'success' });
      }
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      
    } catch (error) {
      console.error('保存地址失败:', error);
      wx.showToast({ 
        title: error.message || '保存失败', 
        icon: 'none' 
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});

