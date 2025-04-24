const cron = require('node-cron');

const { isOpen24x7, getClosingTime, closeLibrary } = require('../utils/libraryUtils'); 

// schedule task to check every minute if the library needs to close
cron.schedule('* * * * *', async () => {
    if (await isOpen24x7()) return;         //skip if library operates 24x7
  
    const now = new Date();
    const closingTime = await getClosingTime(); 
    
    // close library if the current time matches the closing time
    if (
      now.getHours() === closingTime.getHours() &&
      now.getMinutes() === closingTime.getMinutes()
    ) {
      await closeLibrary();  // perform closing operations : ending sessions
      console.log('Library closed, sessions marked completed.');
    }
});