var https = require('https');

var PAYBEAR_SECRET = sails.config.PAYBEAR_SECRET;

function getAddress(orderId, token, callback) {
    //var payoutAddress = getPayout(token);
    var callbackUrl = 'http://chiba-server.herokuapp.com/callback/' + orderId;
    var encoded = encodeURIComponent(callbackUrl);
    var url = 'https://api.paybear.io/v2/' + token.toLowerCase() + '/payment/' + encoded + '/' +  '?token=' + PAYBEAR_SECRET;

    https.get(url, function (res) {
        var rawData = '';
        res.on('data', function (chunk) { 
            rawData += chunk; 
        });

        res.on('end', function () {
            var response = JSON.parse(rawData);
            if (response.success) {
                sails.log.debug("paybear invoice: " + response.data.invoice);
                sails.log.debug("added invoice code");
                Deposit.update({id: orderId}, {invoice: response.data.invoice}).exec((err, _updatedDeposit) => {
                    if(err) {
                        sails.log.error("err in updating deposit: " + JSON.stringify(err));
                        return;
                    }
                    if(!_updatedDeposit) {
                        sails.log.error("undefined updated deposit");
                    }
                })
                callback(response.data.address);
            }
        });
    }).on('error', function (e) {
        console.error(e);
        callback(null);
    });
}

function getCurrencies(callback)
{
    var currencies = null; //TODO: add cache here?

    var url = 'https://api.paybear.io/v2/currencies?token=' + PAYBEAR_SECRET;

    https.get(url, function (res) {
        var rawData = '';
        res.on('data', function (chunk) { rawData += chunk; });

        res.on('end', function () {
            var response = JSON.parse(rawData);
            if (response.success) {
                callback(response.data);
            }
        });
    }).
    on('error', function (e) {
        console.error(e);
        callback(null);
    });
}

function getCurrency(token, orderId, getAddr, callback) {
  getRate(token, function(rate) {
    if (rate) {
      Deposit.findOne({id: orderId}).exec((err, _deposit) => {
        if(err || !_deposit) {
          sails.log.error("could not find order for orderId: " + orderId);
          return;
        }
        var fiatValue = parseFloat(_deposit.depositAmount); 
        var coinsValue = +(fiatValue / rate).toFixed(8);
        var currency = null;

        getCurrencies(function(currencies) {
            currency = currencies[token];
            currency['coinsValue'] = coinsValue;

            if (getAddr) {
                getAddress(orderId, token, function(address) {
                    currency['address'] = address;
                    currency['blockExplorer'] = currency['blockExplorer'] + address;
                    callback(currency);
                });
            } else {
                currency['currencyUrl'] = '/paybear/currencies?order=' + orderId + '&token=' + token;
                callback(currency);
            }
        });
      });
    }
  });
}

function getRate(curCode, callback) {
  curCode = curCode.toLowerCase();
  getRates(function (rates) {
    rates[curCode] ? callback(rates[curCode].mid) : callback(false);
  });
}

function getRates(callback) {
  var url = 'https://api.paybear.io/v2/exchange/usd/rate';

  https.get(url, function (res) {
    var rawData = '';
    res.on('data', function (chunk) { rawData += chunk; });

    res.on('end', function () {
      var response = JSON.parse(rawData);
      if (response.success) {
        callback(response.data);
      }
    });
  }).
  on('error', function (e) {
    console.error(e);
    callback(null);
  });
}

module.exports = {
  getAddress: getAddress,
  getCurrency: getCurrency,
  getRate: getRate,
  getRates: getRates
};
