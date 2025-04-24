const axios = require('axios');
const inquirer = require('inquirer');

const studentDashboard = async (token, roll_number) => {
  const dashboardOptions = [
    'View Seat Layout',
    'Book a Seat',
    'Create a Group',
    'Book Group Reservation',
    'View Reservation History',
    'Delete an active Reservation',
    'End the Session',
    'Logout'
  ];
  let exit = false;
  while (!exit) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Student Dashboard - Choose an action:',
        choices: dashboardOptions,
        pageSize: 8
      }
    ]);

    try {
      switch (action) {
        case 'View Seat Layout':
            const res2 = await axios.get(`http://localhost:5000/seats/layout`);
            const layout = res2.data; 

            const tableFormatted = {};

            for (const row in layout) {
                tableFormatted[row] = {};
                layout[row].forEach(seat => {
                    tableFormatted[row][seat.col] = seat.status;
                });
            }
            console.table(tableFormatted);

            break;
        
        case 'Book a Seat':
            const { seatId } = await inquirer.prompt([{ name: 'seatId', message: 'Seat ID to book:' }]);
            const res = await axios.post(`http://localhost:5000/reservation/book/${seatId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
            });
            console.log(`\n You have successfully booked seat #${seatId}.`);
            console.log(`\nYour reservation ID: ${res.data.reservation_id}`);
            console.log('\n Share the following QR Code data with the Admin for claiming:');
            console.log(res.data.qrCodeData); 
            break;

        case 'Create a Group':
            const groupData = await inquirer.prompt([
            { name: 'group_name', message: 'Group Name:' },
            { name: 'roll_numbers', message: 'Comma-separated Roll Numbers (excluding yourself):' }
            ]);
            const rollNums = groupData.roll_numbers.split(',').map(Number);
            const fullData = {
            group_name: groupData.group_name,
            roll_numbers: [parseInt(roll_number), ...rollNums]
            };
            const resi = await axios.post('http://localhost:5000/user/group/create', fullData, {
            headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Group created successfully.');
            console.log(`Group ID is: ${resi.data.group_id}.`);
            break;
        
        case 'Book Group Reservation':
            const groupResData = await inquirer.prompt([
                { name: 'group_name', message: 'Group Name:' },
                { name: 'seat_ids', message: 'Comma-separated Seat IDs:' }
            ]);
            const seatIds = groupResData.seat_ids.split(',').map(id => id.trim());
            const groupBookBody = {
                group_name: groupResData.group_name,
                seat_ids: seatIds
            };
            const groupRes = await axios.post('http://localhost:5000/group/book', groupBookBody, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Group reservation successful!');
            console.log('\nShare this QR code data with Admin to claim it:');
            console.log(groupRes.data.qrCodeData);
            break;

        case 'View Reservation History':
            const res1 = await axios.get(`http://localhost:5000/reservation/my/${roll_number}`, {
            headers: { Authorization: `Bearer ${token}` }
            });
            // console.log(res1.data);
            
            const reservations = res1.data.reservations;

            reservations.forEach(reservation => {
              console.log(`Reservation ID: ${reservation.reservation_id}`);
              console.log(`Status: ${reservation.reservation_status}`);
              console.log(`Type: ${reservation.type}`);
              
              if (reservation.type === 'individual') {
                console.log(`Seat ID: ${reservation.seat_id}`);
              } else if (reservation.type === 'group') {
                console.log(`Seat IDs: ${reservation.seat_ids.join(', ')}`);
              }
          
              console.log('----------------------------');
            });
            break;

        case 'Delete an active Reservation':
            const { delId } = await inquirer.prompt([{ name: 'delId', message: 'Reservation ID to delete:' }]);
            await axios.delete(`http://localhost:5000/reservation/delete/${delId}`, {
            headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Reservation deleted.');
            break;

        case 'End the Session':
            const { endId } = await inquirer.prompt([{ name: 'endId', message: 'Reservation ID to end:' }]);
            await axios.patch(`http://localhost:5000/reservation/end/${endId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Session ended.');
            break;

        case 'Logout':
            console.log('Logged out.');
            exit = true;
            break;
      }
    }   catch (err) {
            console.error('Error:', err.response?.data?.error || err.message);
    }
  }
};

module.exports = { studentDashboard };
