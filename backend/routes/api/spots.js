const express = require('express');
const { Spot, Booking, SpotImage, User } = require('../../db/models'); // Import models
const { requireAuth } = require('../../utils/auth');
const { check } = require('express-validator');
const { Op } = require('sequelize');
const { handleValidationErrors } = require('../../utils/validation');

const router = express.Router();

// Validation middleware for bookings
const validateBooking = [
  check('startDate')
    .exists({ checkFalsy: true })
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),
  check('endDate')
    .exists({ checkFalsy: true })
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  handleValidationErrors,
];

// GET /api/spots/:spotId/bookings - Get bookings for a specific spot
router.get('/:spotId/bookings', requireAuth, async (req, res) => {
  const { spotId } = req.params;
  const userId = req.user.id;

  // Check if spot exists
  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: 'Spot not found' });
  }

  // If user owns the spot, include user details in the booking
  if (spot.ownerId === userId) {
    const bookings = await Booking.findAll({
      where: { spotId },
      include: {
        model: User,
        attributes: ['id', 'username'], // Include user details
      },
    });
    return res.json({ Bookings: bookings });
  }

  // If user does NOT own the spot, return limited booking info
  const bookings = await Booking.findAll({
    where: { spotId },
    attributes: ['spotId', 'startDate', 'endDate'], // Only include booking dates
  });

  res.json({ Bookings: bookings });
});

// POST /api/spots/:spotId/bookings - Create a new booking for a spot
router.post('/:spotId/bookings', requireAuth, validateBooking, async (req, res) => {
  const { spotId } = req.params;
  const userId = req.user.id;
  const { startDate, endDate } = req.body;

  // Check if spot exists
  const spot = await Spot.findByPk(spotId);
  if (!spot) {
    return res.status(404).json({ message: 'Spot not found' });
  }

  // Check if user owns the spot
  if (spot.ownerId === userId) {
    return res.status(403).json({ message: 'You cannot book your own spot' });
  }

  // Check for booking conflicts
  const conflicts = await Booking.findAll({
    where: {
      spotId,
      [Op.or]: [
        { startDate: { [Op.between]: [startDate, endDate] } },
        { endDate: { [Op.between]: [startDate, endDate] } },
        {
          startDate: { [Op.lte]: startDate },
          endDate: { [Op.gte]: endDate },
        },
      ],
    },
  });

  if (conflicts.length) {
    return res
      .status(403)
      .json({ message: 'The specified dates conflict with an existing booking' });
  }

  // Create the new booking
  const newBooking = await Booking.create({
    spotId,
    userId,
    startDate,
    endDate,
  });

  res.status(201).json(newBooking);
});

module.exports = router;
