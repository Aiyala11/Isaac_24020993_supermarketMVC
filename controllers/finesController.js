// finesController.js

module.exports = {
	// All fines endpoints should respond with 410 Gone to indicate the feature was removed.
	deprecated: (req, res) => {
		// If you want to show a friendly page instead of plain text, render a small EJS view here.
		res.status(410).send('Student fines feature has been removed. If this is unexpected, contact the administrator.');
	}
};