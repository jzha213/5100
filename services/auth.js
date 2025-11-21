const { request } = require('../utils/request');
const API = require('../config/api');

module.exports = {
  login({ username, password }){
    return request({ url: API.AUTH.LOGIN, method:'POST', data:{ username, password } });
  },
  profile(){ 
    return request({ url: API.AUTH.PROFILE, method:'GET' }); 
  },
  updateProfile(data) {
    return request({ 
      url: API.AUTH.PROFILE, 
      method: 'PUT', 
      data: data 
    });
  },
  register(data) {
    return request({ 
      url: API.AUTH.REGISTER, 
      method: 'POST', 
      data: data 
    });
  }
}


