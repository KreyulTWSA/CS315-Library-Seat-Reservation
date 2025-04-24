const pool = require('../config/db');

// Function to check if all roll numbers exist in the Students table
const checkRollNums = async (rollNumbers) => {
    const query = `
        SELECT roll_number FROM Students WHERE roll_number = ANY($1)
    `;
    const { rows } = await pool.query(query, [rollNumbers]);
    return rows.map(row => row.roll_number);
};
  
// Function to add students to the Student_Group_Members table
const addToGroup = async (rollNumbers, groupId) => {
const queries = rollNumbers.map(rollNo => {
    return pool.query(
        'INSERT INTO Student_Group_Members (roll_number, group_id) VALUES ($1, $2)',
        [rollNo, groupId]
    );
});
await Promise.all(queries);
};

// Create a new group and return its group_id
const createSGroup = async (groupName) => {
    const result = await pool.query(
      'INSERT INTO Student_Groups (group_name) VALUES ($1) RETURNING group_id',
      [groupName]
    );
    return result.rows[0].group_id;
};

module.exports = {
    checkRollNums,
    createSGroup,
    addToGroup
};