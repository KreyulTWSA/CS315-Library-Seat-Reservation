const QRCode = require('qrcode');
const Jimp = require('jimp');
const QrCode = require('qrcode-reader');

// Function to generate QR code for a reservation 
function generateQRCode(reservation_id, roll_number) {
  const qrPayLoad = `${reservation_id}-${roll_number}`;
  try {
    return QRCode.toDataURL(qrPayLoad);
  } catch (err) {
    throw new Error('Failed to generate QR Code');
  }
}

// Function to decode a base64 encoded QR code image
async function decodeQRCode(base64) {
  const base64Data = base64.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const image = await Jimp.read(buffer);
  const qr = new QrCode();

  return new Promise((resolve, reject) => {
    qr.callback = (err, value) => {
      if (err) return reject(err);
      resolve(value.result);
    };
    qr.decode(image.bitmap);
  });
}

// Function to validate individual QR code with reservation details 
function validateQRCode(qrCodeData, reservation) {
  const expectedQRCodeData = `${reservation.reservation_id}-${reservation.roll_number}`;
  return qrCodeData === expectedQRCodeData;
}

// Function to validate group QR code data group reservation details
function validateGrpQRCode(qrCodeData, reservation) {
  const expectedQRCodeData = `${reservation.group_reservation_id}-${reservation.group_id}`;
  return qrCodeData === expectedQRCodeData;
}

module.exports = { generateQRCode, validateQRCode, decodeQRCode, validateGrpQRCode };
