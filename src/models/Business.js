'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Business = sequelize.define('Business', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    businessName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'business_name',
    },
    ownerName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'owner_name',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    whatsapp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Images (store as JSON array of URLs)
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    // Address & Location
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    // Business details
    email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    openingHours: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'opening_hours',
    },
    // Search optimization
    keywords: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Verification & Status
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_verified',
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured',
    },
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_approved',
    },
    // Admin fields
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at',
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'verified_by',
    },
    // User reference (who created this business)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
    },
    // View count
    views: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    timestamps: true,
    underscored: true,
    tableName: 'businesses',
  });

  // Instance methods
  Business.prototype.toJSON = function() {
    const values = { ...this.get() };
    return values;
  };

  // Associate with other models
  Business.associate = (models) => {
    Business.belongsTo(models.User, { foreignKey: 'userId', as: 'owner' });
  };

  return Business;
};
