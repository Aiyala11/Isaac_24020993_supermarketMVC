// Student fines feature removed. Return 410 Gone for any cart/fines related endpoints.
module.exports = {
  list: (req, res) => res.status(410).send('Student fines feature has been removed.'),
  add: (req, res) => res.status(410).send('Student fines feature has been removed.'),
  remove: (req, res) => res.status(410).send('Student fines feature has been removed.'),
  clear: (req, res) => res.status(410).send('Student fines feature has been removed.'),
};