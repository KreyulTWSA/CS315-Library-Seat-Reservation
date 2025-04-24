const axios = require('axios');
const inquirer = require('inquirer');
const { studentDashboard } = require('./studentDashboard');
const { adminDashboard } = require('./adminDashboard');

const studentLogin = async () => {
  const creds = await inquirer.prompt([
    { name: 'email', message: 'Email:' },
    { type: 'password', name: 'password', message: 'Password:' }
  ]);

  try {
    const res = await axios.post('http://localhost:5000/auth/login', creds);
    const token = res.data.token;
    console.log('Login successful!');
    await studentDashboard(token, res.data.user.roll_number); 
    return;
  } catch (err) {
    console.error('Login failed:', err.response?.data?.error || err.message);
  }
};

const studentSignup = async () => {
  const signupData = await inquirer.prompt([
    { name: 'naam', message: 'Name:' },
    { name: 'email', message: 'Email:' },
    { type: 'password', name: 'password', message: 'Password:' },
    { name: 'roll_number', message: 'Roll Number:' }
  ]);

  try {
    await axios.post('http://localhost:5000/auth/signup', signupData);
    console.log('\n Signup successful! You can now login.\n');
  } catch (err) {
    console.error('\n Signup failed:', err.response?.data?.error || err.message);
  }
};

const adminLogin = async () => {
  const creds = await inquirer.prompt([
    { name: 'email', message: 'Admin Email:' },
    { type: 'password', name: 'password', message: 'Admin Password:' }
  ]);

  try {
    const res = await axios.post('http://localhost:5000/auth/admin-login', creds);
    const token = res.data.token;
    console.log('\n Admin Login successful!');
    await adminDashboard(token, );
  } catch (err) {
    console.error('\n Admin login failed:', err.response?.data?.error || err.message);
  }
};

module.exports = { studentLogin, studentSignup, adminLogin };
