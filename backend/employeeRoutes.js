const express = require('express');
const router = express.Router();
const Employee = require('./Employee');

// Employee assignment for under maintenance rooms removed as requested

// Get all employees (for mapping employeeCode to name)
router.get('/', async (req, res) => {
	try {
		const employees = await Employee.find({}, 'employeeCode name role department jobTitle');
		res.json({ employees });
	} catch (err) {
		res.status(500).json({ error: 'Failed to fetch employees' });
	}
});

module.exports = router;
