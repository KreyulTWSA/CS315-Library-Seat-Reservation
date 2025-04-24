const inquirer = require('inquirer');
const axios = require('axios');

const adminCreate = async () => {
  const superCreds = await inquirer.prompt([
    { name: 'email', message: 'Super Admin Email:' },
    { type: 'password', name: 'password', message: 'Super Admin Password:' }
  ]);

  try {
    const loginRes = await axios.post('http://localhost:5000/auth/admin-login', superCreds);
    const superToken = loginRes.data.token;
    
    const newAdminData = await inquirer.prompt([
      { name: 'naam', message: 'New Admin Name:' },
      { name: 'email', message: 'New Admin Email:' },
      { type: 'password', name: 'password', message: 'New Admin Password:' }
    ]);

    await axios.post('http://localhost:5000/auth/create-admin', newAdminData, {
      headers: { Authorization: `Bearer ${superToken}` }
    });

    console.log('Admin successfully created!');
  } catch (err) {
    console.error('Failed to create admin:', err.response?.data?.error || err.message);
  }
};

module.exports = { adminCreate };
