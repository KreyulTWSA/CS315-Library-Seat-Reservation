const {
    checkRollNums,
    createSGroup,
    addToGroup
  } = require('../utils/userUtils');

// Create a new student group
const createGroup = async (req, res) => {
    const { group_name, roll_numbers } = req.body;
    
    // Validating input
    if (!group_name || !roll_numbers || roll_numbers.length === 0) {
        return res.status(400).json({ error: 'Group name and roll numbers are required.' });
    }
    try {
        // Check if all provided roll numbers exist in the Students table
        const existingOnes = await checkRollNums(roll_numbers);
        if (existingOnes.length !== roll_numbers.length) {
            return res.status(404).json({ 
                error: 'Some roll numbers do not exist in the system.' });
        }

        // Create the group and update the database
        const groupID = await createSGroup(group_name);
        await addToGroup(roll_numbers, groupID);
        
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