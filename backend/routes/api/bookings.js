const express = require('express');
const { Booking, Spot, SpotImage } = require('../../db/models'); // Adjust based on your models
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

// GET /api/bookings/current - Get current user's bookings
router.get('/current', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const bookings = await Booking.findAll({
    where: { userId },
    include: {
      model: Spot,
      include: [
        {
          model: SpotImage,
          where: { preview: true }, // Only include preview images
          required: false,
          attributes: ['url'], // Fetch only the image URL
        },
      ],
      attributes: ['id', 'name', 'address'], // Include specific Spot details
    },
  });

  const formattedBookings = bookings.map((booking) => {
    const spot = booking.Spot;
    const previewImage = spot.SpotImages?.length ? spot.SpotImages[0].url : null;

    return {
      id: booking.id,
      spotId: booking.spotId,
      userId: booking.userId,
      startDate: booking.startDate,
      endDate: booking.endDate,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      Spot: {
        id: spot.id,
        name: spot.name,
        address: spot.address,
        previewImage,
      },
    };
  });

  res.json({ Bookings: formattedBookings });
});

// PUT /api/bookings/:bookingId - Update a booking
router.put('/:bookingId', requireAuth, validateBooking, async (req, res) => {
  const { bookingId } = req.params;
  const { startDate, endDate } = req.body;
  const userId = req.user.id;

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  if (booking.userId !== userId) {
    return res.status(403).json({ message: 'You do not own this booking' });
  }

  if (new Date(booking.endDate) < new Date()) {
    return res.status(403).json({ message: 'Cannot modify a past booking' });
  }

  const conflicts = await Booking.findAll({
    where: {
      spotId: booking.spotId,
      id: { [Op.ne]: bookingId },
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

  booking.startDate = startDate;
  booking.endDate = endDate;
  await booking.save();

  res.json(booking);
});

// DELETE /api/bookings/:bookingId - Delete a booking
router.delete('/:bookingId', requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const booking = await Booking.findByPk(bookingId, {
    include: { model: Spot },
  });

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found' });
  }

  if (booking.userId !== userId && booking.Spot.ownerId !== userId) {
    return res.status(403).json({ message: 'You do not have permission to delete this booking' });
  }

  if (new Date(booking.startDate) <= new Date()) {
    return res.status(403).json({ message: 'Cannot delete a booking that has already started' });
  }

  await booking.destroy();

  res.json({ message: 'Successfully deleted' });
});

module.exports = router;
