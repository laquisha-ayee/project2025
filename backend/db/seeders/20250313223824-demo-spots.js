'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Spots', [
      {
        name: 'Beautiful Beach House',
        address: '123 Ocean Drive',
        ownerId: 1, // Assuming Demo-lition owns this spot
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Cozy Cabin in the Woods',
        address: '456 Forest Lane',
        ownerId: 2, // Assuming FakeUser1 owns this spot
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Luxurious Penthouse',
        address: '789 Skyline Ave',
        ownerId: 3, // Assuming FakeUser2 owns this spot
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Spots', null, {});
  },
};
