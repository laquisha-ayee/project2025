const { Model } = require('sequelize');
const { isBefore } = require('date-fns'); 

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
    
      Booking.belongsTo(models.User, { foreignKey: 'userId' });

      
      Booking.belongsTo(models.Spot, { foreignKey: 'spotId' });
    }
  }

  Booking.init(
    {
      spotId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'Spot ID is required' },
          isInt: { msg: 'Spot ID must be an integer' },
        },
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: { msg: 'User ID is required' },
          isInt: { msg: 'User ID must be an integer' },
        },
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: { msg: 'Start date is required' },
          isDate: { msg: 'Start date must be a valid date' },
          isInTheFuture(value) {
            if (isBefore(new Date(value), new Date())) {
              throw new Error('Start date cannot be in the past');
            }
          },
        },
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notNull: { msg: 'End date is required' },
          isDate: { msg: 'End date must be a valid date' },
          isAfterStart(value) {
            if (value <= this.startDate) {
              throw new Error('End date must be after start date');
            }
          },
        },
      },
    },
    {
      sequelize,
      modelName: 'Booking',
    }
  );

  return Booking;
};
