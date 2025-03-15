'use strict';

const { User, Spot, Booking } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA; // Use schema for production
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get demo users
    const demoUser = await User.findOne({ where: { username: 'Demo-lition' } });
    console.log('Demo User:', demoUser); // Debug log

    const user1 = await User.findOne({ where: { username: 'FakeUser1' } });
    console.log('User 1:', user1); // Debug log

    const user2 = await User.findOne({ where: { username: 'FakeUser2' } });
    console.log('User 2:', user2); // Debug log

    // Get all spots
    const spots = await Spot.findAll();
    console.log('Spots:', spots); // Debug log

    // Helper function to calculate future dates
    const daysFromNow = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    };

    // Create sample bookings
    const bookings = [
      {
        spotId: spots[0].id, // Spot 1
        userId: user1.id, // User 1
        startDate: daysFromNow(10), // 10 days from now
        endDate: daysFromNow(15), // 15 days from now
      },
      {
        spotId: spots[0].id, // Spot 1
        userId: user2.id, // User 2
        startDate: daysFromNow(20), // 20 days from now
        endDate: daysFromNow(25), // 25 days from now
      },
      {
        spotId: spots[1].id, // Spot 2
        userId: demoUser.id, // Demo User
        startDate: daysFromNow(5), // 5 days from now
        endDate: daysFromNow(8), // 8 days from now,
      },
      {
        spotId: spots[1].id, // Spot 2
        userId: user2.id, // User 2
        startDate: daysFromNow(12), // 12 days from now
        endDate: daysFromNow(16), // 16 days from now,
      },
      {
        spotId: spots[2].id, // Spot 3
        userId: user1.id, // User 1
        startDate: daysFromNow(30), // 30 days from now
        endDate: daysFromNow(35), // 35 days from now,
      },
    ];

    // Bulk insert the bookings
    await Booking.bulkCreate(bookings, options);
  },

  async down(queryInterface, Sequelize) {
    // Delete all bookings
    const Op = Sequelize.Op;
    await queryInterface.bulkDelete(
      'Bookings',
      {
        startDate: {
          [Op.gte]: new Date().toISOString().split('T')[0], // Only remove future bookings
        },
      },
      options
    );
  },
};
