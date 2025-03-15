const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const spotsRouter = require('./spots');
const reviewsRouter = require('./reviews');
const bookingsRouter = require('./bookings'); // Import the bookings router
const { restoreUser } = require("../../utils/auth.js");

// Connect restoreUser middleware to the API router
// If current user session is valid, set req.user to the user in the database
// If current user session is not valid, set req.user to null
router.use(restoreUser);

router.use('/session', sessionRouter);
router.use('/users', usersRouter);
router.use('/spots', spotsRouter);
router.use('/reviews', reviewsRouter);
router.use('/bookings', bookingsRouter); 


router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

router.get('/test-user-bookings', async (req, res) => {
  try {
    const userWithBookings = await User.findOne({
      where: { username: 'Demo-lition' },
      include: Booking,
    });
    res.json(userWithBookings); // Send the result as JSON
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;
