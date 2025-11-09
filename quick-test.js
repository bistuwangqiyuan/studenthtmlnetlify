// 简单的测试脚本
const testAuth = async () => {
  const url = 'https://studenthtmlnetlify.netlify.app/api/auth/login';
  console.log('测试 URL:', url);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    });
    
    console.log('响应状态:', response.status);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('响应内容:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('✅ 登录成功！');
      console.log('Token:', data.token?.substring(0, 20) + '...');
    } else {
      console.log('❌ 登录失败');
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
};

testAuth();

