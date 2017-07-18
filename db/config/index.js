console.log('db/config: NODE_ENV:', process.env.NODE_ENV);

module.exports = require(`./config.${process.env.NODE_ENV || 'development'}`);