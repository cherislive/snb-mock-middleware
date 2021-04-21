const city = require('./geographic/city.json');
const province = require('./geographic/province.json');

function getProvince(req, res) {
  res.json(province);
}

function getCity(req, res) {
  res.json(city[req.params.province]);
}

exports.default = {
  'GET /api/geographic/province': getProvince,
  'GET /api/geographic/city/:province': getCity,
};
