// All fines endpoints should respond with 410 Gone to indicate the feature was removed.
module.exports = {
	deprecated: (req, res) => {
		res.status(410).send('Student fines feature has been removed.');
	}
};
