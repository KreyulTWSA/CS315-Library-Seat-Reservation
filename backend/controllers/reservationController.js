const pool = require('../config/db');
const { isLibOpen,abtToClose } = require('../utils/libraryUtils');
const { getReservation, validReservation, updateStatus_claim, updateStatus_book, updateStatus_end } = require('../utils/reservationUtils');
const { generateQRCode, validateQRCode, decodeQRCode } = require('../utils/qrUtils');
const { isSeatFree } = require('../utils/seatUtils');

// Claim a reservation by verifying QR code
exports.claimReservation = async (req, res) => {
  try {
    // Check if library is open
    const isOpen = await isLibOpen();
    if (!isOpen) {
      return res.status(403).json({ error: 'Outside library hours' });
    }
    
    const { qrCodeData } = req.body;
    const reservationId =  parseInt(req.params.id); // Get reservation ID from params
    
    // Fetch reservation details
    const reservation = await getReservation(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }
    
    // Validate reservation status
    if (!validReservation(reservation)) {
      return res.status(400).json({ error: 'Invalid or expired reservation.' });
    }
    
    // Decode and Validate the QR Code Data
    const decodedQR = await decodeQRCode(qrCodeData);
    if (!validateQRCode(decodedQR, reservation)) {
      return res.status(400).json({ error: 'Invalid QR code' });
    }
    
    // Get admin ID from user context
    const adminId = req.user?.userId || null;
    await updateStatus_claim(reservationId, reservation.seat_id, adminId); // Updates Reservations and Seats Table accordingly

    res.status(200).json({ message: 'Reservation claimed successfully.' });

  } catch (error) {
    console.error('Error claiming reservation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Book a seat for current user
exports.bookReservation = async (req, res) => {
    try {
      const {seat_id} = req.params;
      const rollNumber = req.user.roll_number; // Get roll number of logged-in user
      
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
      
      // Check if seat is available
      const ifFree = await isSeatFree(seat_id);
      if (!ifFree) {
        return res.status(400).json({ error: 'Seat not available' });
      }
      
      // Book the seat
      const reservation_id = await updateStatus_book(rollNumber, seat_id);
      
      // Generate QR code for reservation
      const qrCodeData = await generateQRCode(reservation_id,rollNumber); 
      res.status(201).json({ message: 'Seat booked successfully.', reservation_id, qrCodeData });

    } 
    catch (error) {
      console.error('Error booking seat:', error);
      res.status(500).json({ error: error.message });
    }
  };


// End a reservation session   
exports.endReservation = async (req, res) => {
  try {
      const { id } = req.params;
      
      // Fetch reservation details
      const reservation = await getReservation(id);
      if (!reservation) {
          return res.status(404).json({ error: 'Reservation not found.' });
      }

      const seat_id = reservation.seat_id;
      
      // Mark reservation as ended
      await updateStatus_end(id, seat_id);

      res.status(200).json({ message: 'Session end successful' });

  } catch (err) {
      res.status(500).json({ error: err.message });
  }
};

// Cancel an active reservation 
exports.deleteReservation = async (req, res) => {
  const reservationId = req.params.id;
  try {
    // Fetch the reservation details
    const { rows } = await pool.query(
      `SELECT * FROM Reservations WHERE reservation_id = $1`,
      [reservationId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    const reservation = rows[0];
    
     // Cannot cancel a verified reservation
    if (reservation.verified_by) {
      return res.status(403).json({ error: 'Cannot cancel a validated reservation' });
    }

    // Cannot cancel an expired reservation
    const now = new Date();
    if (new Date(reservation.expires_at) < now) {
      return res.status(410).json({ error: 'Reservation already expired' });
    }

    // Soft delete: mark reservation as cancelled
    await pool.query(
      `UPDATE Reservations SET reservation_status = 'cancelled' WHERE reservation_id = $1`,
      [reservationId]
    );
    
    // Mark the seat as available again
    await pool.query(
      `UPDATE Seats SET seat_status = 'available' WHERE seat_id = $1`,
      [reservation.seat_id]
    );

    return res.status(200).json({ message: 'Reservation successfully cancelled' });

  } catch (err) {
    console.error('Error cancelling reservation:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all reservations (individual + group) for a user
exports.myReservations = async (req, res) => {
  const { roll_number } = req.params;

  try {
    // Fetch Individual reservations
    const individualResult = await pool.query(
      `SELECT 
         r.reservation_id,
         r.seat_id,
         r.reserved_at,
         r.expires_at,
         r.reservation_status,
         r.verified_by,
         'individual' AS type
       FROM Reservations r
       JOIN Seats s ON r.seat_id = s.seat_id
       WHERE r.roll_number = $1
       ORDER BY r.reserved_at DESC`,
      [roll_number]
    );

    // Fetch group reservations for which user is a member 
    const groupResult = await pool.query(
      `SELECT 
        gr.group_reservation_id AS reservation_id,
        ARRAY_AGG(grs.seat_id) AS seat_ids,
        gr.reserved_at,
        gr.expires_at,
        gr.reservation_status,
        gr.verified_by,
        'group' AS type
      FROM Student_Group_Members gm
      JOIN Group_Reservations gr ON gr.group_id = gm.group_id
      JOIN Group_Reservation_Seats grs ON gr.group_reservation_id = grs.group_reservation_id
      WHERE gm.roll_number = $1
      GROUP BY gr.group_reservation_id, gr.reserved_at, gr.expires_at, gr.reservation_status, gr.verified_by
      ORDER BY gr.reserved_at DESC
      `,
      [roll_number]
    );
    
    // Combine and return all reservations
    const allReservations = [...individualResult.rows, ...groupResult.rows];

    res.status(200).json({
      reservations: allReservations,
    });
  } catch (err) {
    console.error('Error fetching reservations:', err);
    res.status(500).json({ error: 'Something went wrong while fetching reservations.' });
  }
};
