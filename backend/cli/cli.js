const inquirer = require('inquirer');
const { studentLogin, adminLogin, studentSignup } = require('./auth');
const { adminCreate } = require('./superAdmin');

const mainMenu = async () => {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message: 'Welcome! What do you want to do?',
      choices: [
        'Login as Student',
        'Login as Admin',
        'Signup as Student',
        'Create a New Admin (Super Admin only)',
        'Exit'
      ]
    }
  ]);

  switch (choice) {  
    case 'Login as Student':
      return studentLogin();
    case 'Login as Admin':
      return adminLogin();
    case 'Signup as Student':
      return studentSignup();
    case 'Create a New Admin (Super Admin only)':
      return adminCreate();
    case 'Exit':
      console.log('Goodbye!');
      process.exit(0);
  }
};

mainMenu();

module.exports = { mainMenu };