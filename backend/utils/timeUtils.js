// Converts a Date object to a string in 'HH:MM' format
function toHHMM(date) {
    return date.toTimeString().slice(0, 5);
}
 
// Validates whether a string is in 'HH:MM' 24-hour format
function validHHMM(time) {
return /^\d{2}:\d{2}$/.test(time);
}

// Converts a 'HH:MM' string to a Date object set to today's date with the given time
function toDateTime(timeString) {
const now = new Date();
const [hours, minutes] = timeString.split(':').map(num => parseInt(num));
now.setHours(hours, minutes, 0, 0);
return now;
}

module.exports = {
toHHMM,
validHHMM,
toDateTime,
};
