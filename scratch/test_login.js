const { loginUser } = require('./src/app/actions/auth');

async function testLogin() {
    const data = {
        email: 'super@textileos.com',
        password: 'Admin@123'
    };
    console.log('Testing login with:', data);
    try {
        const result = await loginUser(data);
        console.log('Login result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Login error:', error);
    }
}

testLogin();
