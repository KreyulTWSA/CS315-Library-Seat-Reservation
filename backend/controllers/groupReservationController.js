const {
  getGrpInfo,
  areSeatsFree,
  createGrpRes,
  bookSeats,
  updateGrpRes,
  updateSeats,
} = require('../utils/dbqueries');
const { generateQRCode, validateGrpQRCode, decodeQRCode } = require('../utils/qrUtils');
const { isLibOpen,abtToClose } = require('../utils/libraryUtils');
const { validReservation } = require('../utils/reservationUtils');
const pool = require('../config/db');


// Book a group reservation
exports.bookGroupReservation = async (req, res) => {
  try {
    const { group_name, seat_ids } = req.body;
    
    // Check if library is open
    const isOpen = await isLibOpen();
      if (!isOpen) {
        return res.status(403).json({ error: 'Outside library hours' });
      }
    
    // Check if library is about to close
    const isClosing = await abtToClose();
    if (isClosing) {
      return res.status(403).json({ error: 'Library is closing soon' });
    }
    
    // Get group_id from group_name
    const groupResult = await pool.query(
      'SELECT group_id FROM Student_Groups WHERE group_name = $1',
      [group_name]
    );
    
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    const group_id = groupResult.rows[0].group_id;
    
    // Verify if the user is part of the group
    const groupRes = await getGrpInfo(group_id, req.user.roll_number);
    if (!groupRes) return res.status(403).json({ message: 'Invalid group or user not in group' });

    // Check if all requested seats are available
    const seatAvailability = await areSeatsFree(seat_ids);
    if (seatAvailability.length !== seat_ids.length) {
      return res.status(400).json({ message: 'One or more seats are not available' });
    }

    // Create group reservation entry
    const groupReservationId = await createGrpRes(group_id);

    // Book selected seats and mark them reserved
    await bookSeats(groupReservationId, seat_ids);
    
    // Generate QR code for claiming
    const qrCodeData = await generateQRCode(groupReservationId, group_id);

    res.json({ message: 'Group reservation successful', groupReservationId, qrCodeData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error booking group reservation' });
  }
};

// Claim a group reservation
exports.claimGroupReservation = async (req, res) => {
  try {
    // check if library is open
    const isOpen = await isLibOpen();
    if (!isOpen) {
      return res.status(403).json({ error: 'Outside library hours' });
    }

    const { qrCode } = req.body;
    const groupReservationId = req.params.id;

    // Get the group reservation details
    const groupRes = await pool.query(`SELECT * FROM Group_Reservations WHERE group_reservation_id = $1`, [groupReservationId]);
    const reservation = groupRes.rows[0];
    if (!reservation) return res.status(404).json({ message: 'Group reservation not found' });
    
    // Validate reservation (not expired)
    if (!validReservation(reservation)) {
      return res.status(400).json({ error: 'Invalid or expired reservation.' });
    }
    
    // Decode and validate the QR code
    const decodedQR = await decodeQRCode(qrCode);
    if (!validateGrpQRCode(decodedQR, reservation)) {
      return res.status(400).json({ error: 'Invalid QR code' });
    }
    
    const adminId = req.user?.userId || null;

    // Begin DB transaction for claiming
    await pool.query('BEGIN');
    await updateGrpRes(groupReservationId, 'claimed', adminId);
    await updateSeats(groupReservationId);
    await pool.query('COMMIT');

    res.json({ message: 'Group reservation claimed' });
  } catch (err) {
    await pool.query('ROLLBACK');  // Rollback on failure
    console.error(err);
    res.status(500).json({ message: 'Error claiming group reservation' });
  }
};
