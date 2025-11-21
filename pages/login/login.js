const auth = require('../../services/auth');
Page({
  data:{ username:'admin', password:'admin123' },
  onInput(e){ const k=e.currentTarget.dataset.field; const v=e.detail.value; this.setData({ [k]:v }); },
  async onLogin(){
    const { username, password } = this.data;
    if(!username || !password){ wx.showToast({ title:'请输入账号密码', icon:'none' }); return; }
    try{
      const res = await auth.login({ username, password });
      console.log('login result:', res);
      // 后端返回结构 { success, message, data: { user, access_token, refresh_token } }
      const token = (res && res.access_token) ? res.access_token : (res && res.data && res.data.access_token) ? res.data.access_token : '';
      if(token){ wx.setStorageSync('token', token); }
      // 尝试保存用户信息，便于其他页面使用（可选）
      const userInfo = (res && res.user) ? res.user : (res && res.data && res.data.user) ? res.data.user : null;
      if (userInfo) {
        wx.setStorageSync('userInfo', userInfo);
      }
      wx.showToast({ title:'登录成功' });
      setTimeout(()=> wx.navigateBack(), 300);
    }catch(e){ wx.showToast({ title:'登录失败', icon:'none' }); }
  }
});

