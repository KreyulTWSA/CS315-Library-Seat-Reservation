const inquirer = require('inquirer');
const axios = require('axios');

const adminDashboard = async (token) => {
  while (true) {
    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Admin Dashboard - Select an option:',
        choices: [
          'View Seat Layout',
          'Update Library Hours',
          'Claim Reservation (QR)',
          'Claim Group Reservation (QR)',
          'View Student Reservation History',
          'Logout'
        ]
      }
    ]);

    try {
      switch (choice) {
        case 'Update Library Hours':
          const libData = await inquirer.prompt([
            { name: 'openingTime', message: 'Opening Time (HH:mm):' },
            { name: 'closingTime', message: 'Closing Time (HH:mm):' },
            { type: 'confirm', name: 'open_24_7', message: 'Open 24/7?' },
            { name: 'startDate', message: 'Start Date (YYYY-MM-DD):' },
            { name: 'endDate', message: 'End Date (YYYY-MM-DD):' }
          ]);
          await axios.patch('http://localhost:5000/admin/library-hours', libData, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Library hours updated.');
          break;

        case 'Claim Reservation (QR)':
          const { reservationId, qrCodeData } = await inquirer.prompt([
            { name: 'reservationId', message: 'Reservation ID:' },
            { name: 'qrCodeData', message: 'QR Code (base64 string):' },
          ]);
          await axios.patch(`http://localhost:5000/reservation/claim/${reservationId}`, { qrCodeData }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Reservation claimed.');
          break;

        case 'Claim Group Reservation (QR)':
          const { groupReservationId, groupQrData } = await inquirer.prompt([
            { name: 'groupReservationId', message: 'Group Reservation ID:' },
            { name: 'groupQrData', message: 'Group QR Code (base64 string):' },
          ]);
          await axios.post(`http://localhost:5000/group/claim/${groupReservationId}`, { qrCode: groupQrData }, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Group reservation claimed.');
          break;

        case 'View Student Reservation History':
          const { roll_number } = await inquirer.prompt([{ name: 'roll_number', message: 'Student Roll Number:' }]);
          const res = await axios.get(`http://localhost:5000/reservation/my/${roll_number}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log('Reservations:', res.data);
          break;

        case 'View Seat Layout':
          const layout = await axios.get('http://localhost:5000/seats/layout');
          console.table(layout.data);
          break;

        case 'Logout':
          console.log('Logged out.');
          return;
      }
    } catch (err) {
      console.error('Error:', err.response?.data?.error || err.message);
    }
  }
};

module.exports = { adminDashboard };
