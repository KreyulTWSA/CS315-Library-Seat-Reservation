const { generateQRCode, decodeQRCode, validateQRCode } = require('../utils/qrUtils');


(async () => {
    const reservation = { reservation_id: 42, roll_number: 210944 };
  
    const qr = await generateQRCode(reservation.reservation_id, reservation.roll_number);
    console.log("Generated QR base64:", qr.slice(0, 50) + "...");
  
    const decoded = await decodeQRCode(qr);
    console.log("Decoded text:", decoded);  // Should be "42-210944"
  
    const isValid = validateQRCode(decoded, reservation);
    console.log("QR Valid?", isValid);     // Should be true
  })();
  