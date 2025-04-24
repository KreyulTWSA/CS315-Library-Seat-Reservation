const inquirer = require('inquirer');
const { studentLogin, adminLogin, studentSignup } = require('./auth');
const { adminCreate } = require('./superAdmin');

const mainMenu = async () => {
  while (true) {
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
        await studentLogin();
        break;
      case 'Login as Admin':
        await adminLogin();
        break;
      case 'Signup as Student':
        await studentSignup();
        break;
      case 'Create a New Admin (Super Admin only)':
        await adminCreate();
        break;
      case 'Exit':
        console.log('Goodbye!');
        process.exit(0);
    }
  }
};

mainMenu();

module.exports = { mainMenu };