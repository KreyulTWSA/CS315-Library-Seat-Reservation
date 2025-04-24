const pool = require('../config/db');
const {
    checkRollNums,
    addToGroup
  } = require('../utils/dbqueries');

// Create a new student group
const createGroup = async (req, res) => {
    const { group_name, roll_numbers } = req.body;
    
    // Validate input: group name and at least one roll number required
    if (!group_name || !roll_numbers || roll_numbers.length === 0) {
        return res.status(400).json({ error: 'Group name and roll numbers are required.' });
    }

    try {
         // Check if all provided roll numbers exist in the Students table
         const existingOnes = await checkRollNums(roll_numbers);
         const missing = roll_numbers.filter(roll => !existingOnes.includes(roll));
        
        // Return error if any roll numbers are missing
        if (missing.length > 0) {
            return res.status(404).json({
                error: 'Some roll numbers do not exist in the system.',
                missing_roll_numbers: missing
            });
        }

        // Create the group and get the generated group_id
        const result = await pool.query(
            'INSERT INTO Student_Groups (group_name) VALUES ($1) RETURNING group_id',
            [group_name]
        );
        const groupID = result.rows[0].group_id;
        
        // Add all valid students to the newly created group
        await addToGroup(roll_numbers, groupID);
        
        // Return success response with the new group ID
        res.status(201).json({
            message: 'Group created successfully',
            group_id: groupID
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { createGroup };