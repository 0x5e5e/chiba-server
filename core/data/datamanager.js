/**
 * Data Manager - manage crypto data 
 */
const fs = require('fs'); 
const request = require('request');
const convert = require('./conversion.js');
const cron = require('node-cron');
const binance = require('node-binance-api');

let offeringList = [];
let offeringListData = {};
let coinmarketcapData = {};

let toplistMarketCap = [];
let toplistChange = [];

const relativeDir = 'core/data/json/';
const COINMARKETCAP_API = 'https://api.coinmarketcap.com/v1/';
const CRYPTOCOMPARE_API = 'https://min-api.cryptocompare.com/data/';

const currencyRegex =  /^\-?\d+\.\d\d$/;
 
const toplistUpdateJob = cron.schedule('* * * * *', function() {
    updateToplistData();
}, true);

module.exports = {

    /**
     * Load JSON data files into memory 
     */
    initialize: function() {

        /**
         * Populate offering data + offering list 
         */
        offeringListData = JSON.parse(fs.readFileSync(relativeDir + 'offeringData.json'));
        Object.keys(offeringListData).forEach((key) => {
            offeringList.push(key);
        });
        sails.log.debug("Offering Data + List loaded successfully")

        /**
         * Populate Volume data on startup 
         */
        updateVolumeData();
        
        /**
         * Start cron job to update toplist data 
         */
        updateToplistData();
        toplistUpdateJob.start();
        sails.log.debug("Toplist Data loaded successfully");

    },

    /**
     * Get cryptocurrency offering list
     */
    getOfferingList: function() {
        return offeringList;
    },

    /**
     * Get data for cryptocurrency offering list
     */
    getOfferingListData: function() {
        return offeringListData;
    },

    /**
     * Get volume data
     */
    getVolumeData: function() {
        return coinmarketcapData;
    },

    /**
     * Get toplist data
     */
    getToplist: function(filterType) {
        switch(filterType) {
            case 'marketcap':
                return toplistMarketCap;
            case 'change':
                return toplistChange;
            default: 
                return {};
        }
    },

    /**
     * Get enforced currency regex
     */
    getCurrencyRegex: function() {
        return currencyRegex;
    }
};

function updateToplistData() {
    try {
        /**
         * By Market Cap
         */
        /**request({
            headers: {
                'X-CMC_PRO_API_KEY': '1baa8b9a-70d6-42d3-8314-efc997ee707d'
            },
            uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
            qs: {
                'start': '1',
                'limit': '100',
                'convert': 'USD,BTC'
            },
            method: 'GET'
        }, (err, resp, bd) => {
            if(err || !bd) {
                console.log(err);
                return;
            }
            let receivedData = JSON.parse(bd);
            console.log(receivedData);
            let count = 0;
            let updatedList = [];
            receivedData.forEach((element) => {
                let ticker = convert.parseTicker(element.symbol);
                if(offeringList.includes(ticker) && count < 25) {
                    updatedList.push(ticker);
                    count++;
                }
            });

            // persist to memory
            toplistMarketCap = updatedList;
        });*/
        toplistMarketCap = [];

        /**
         * By % Change
         */
        let split = Math.ceil(offeringList.length / 2);
        let part1 = offeringList.slice(0, split);
        let part2 = offeringList.slice(split, offeringList.length);
        let percentChanges = [];

        let part1Data = {};

        request.get(CRYPTOCOMPARE_API + 'pricemultifull?fsyms=' + part1.join() + '&tsyms=USD', (err, resp, bd) => {
            if(err || !bd) {
                console.log(err);
                return;
            }
            let receivedData = null;
            try {
                receivedData = JSON.parse(bd);
            } catch (e) { 
                sails.log.error(e);
            }

            if (receivedData && typeof receivedData === "object") {
                part1Data = receivedData.RAW;
                if(!part1Data) {
                    sails.log.error("error retrieving pricemultifull data");
                    return;
                }
            } else {
                return;
            }

            request.get(CRYPTOCOMPARE_API + 'pricemultifull?fsyms=' + part2.join() + '&tsyms=USD', (err1, resp1, bd1) => {
                if(err1 || !bd1) {
                    sails.log.error("error retrieving pricemultifull data");
                    return;
                }
                try {
                    let receivedData1 = JSON.parse(bd1);
                    if(receivedData1) {
                        part2Data = receivedData1.RAW;
                        Object.keys(part1Data).forEach((key) => {
                            percentChanges.push({ticker: key, change: part1Data[key].USD.CHANGEPCT24HOUR});
                        });
                        Object.keys(part2Data).forEach((key) => {
                            percentChanges.push({ticker: key, change: part2Data[key].USD.CHANGEPCT24HOUR});
                        });
                        percentChanges.sort(function(a,b) {return (a.change > b.change) ? 1 : ((b.change > a.change) ? -1 : 0);} );
                        percentChanges.forEach((t) => {
                            toplistChange.push(t);
                        });
                    }
                } catch(e) {
                    sails.log.error(e);
                }
            });
        });
    } catch(requestError) {
        sails.log.error(requestError);
    }
}

/**
 * Update Volume data 
 */
function updateVolumeData() {
    request.get(COINMARKETCAP_API + 'ticker', (err, resp, bd) => {
        if(err || !bd) {
            console.log(err);
            return;
        }
        let receivedData = JSON.parse(bd);
        let dataToReturn = [];
        receivedData.forEach((element) => {
            let key = '24h_volume_usd';
            let ticker = convert.parseTicker(element.symbol);
            dataToReturn.push({ticker: ticker, volume: element[key]}); 
        });

        // persist to memory
        coinmarketcapData = dataToReturn;

        sails.log.debug("Volume Data loaded successfully");
    });
}

/**
 * CoinMarketCap override
 */
function overrideData() {
    let coinmarketcap = JSON.parse(fs.readFileSync(relativeDir + 'util/coinmarketcap.json'));
    coinmarketcap.forEach((element) => {
        console.log("symbol = " + element.symbol);
        var ticker = convert.parseTicker(element.symbol);
        if(!offeringListData[ticker]) {
            sails.log.error('error in offeringListData: ' + ticker);
            return;
        }
        offeringListData[ticker].totalCoinsMined = element.available_supply;
    });
    let dataToOutput = JSON.stringify(offeringListData);
    fs.writeFile(relativeDir + 'offeringData2.json', dataToOutput, 'utf8', function() {
        console.log('finally done!');
    });
}

/**
 * Update offeringData.json
 */
function updateData() {

    console.log("[updateData] Reading in coinlist.json");

    const cryptoData = JSON.parse(fs.readFileSync(relativeDir + 'util/ccdata.json'));
    let finalData = {};

    console.log("[updateData] Iterating through coin offering");
    Object.keys(offeringList).forEach((key, index) => {
        let convertedKey = key;
        /**
         * Load from coinlist.json
         */
        let coinData = cryptoData.Data[convertedKey];
        if(!coinData) {
            console.log("could not find " + convertedKey);
            return;
        }

        finalData[convertedKey] = {
            "ccId": coinData.Id,
            "currency": coinData.CoinName,
            "symbol": key,
            "description": "",
            "features": "",
            "assetType": "",
            "hashAlgorithm": coinData.Algorithm,
            "proofType": coinData.ProofType,
            "totalCoinSupply": coinData.TotalCoinSupply,
            "whitepaper": ""
        };

        /**
         * Load from CryptoCompare API 
         */
        let api_url = 'https://www.cryptocompare.com/api/data/coinsnapshotfullbyid/?id=' + coinData.Id;
        request.get(api_url, (error, response, body) => {
            if(error || !body) {
                console.log(error);
                return;
            }
            let responseData = JSON.parse(body).Data.General;
            let _a = finalData[convertedKey];

            // populate values 
            let desc = responseData.Description;
            let stripped_desc = (!desc) ? "" : desc.replace(/<\/?[^>]+(>|$)/g, "");
            _a.description = stripped_desc;

            let fea = responseData.Technology;
            let stripped_fea = (!fea) ? "" : fea.replace(/<\/?[^>]+(>|$)/g, "");
            _a.features = stripped_fea;

            _a.startDate = responseData.StartDate;
            
            let site = responseData.Website; 
            let idx_of_end = site.indexOf('\'', 9)
            let extracted_string = site.slice(9, idx_of_end);
            _a.website = extracted_string;
            _a.netHashesPerSecond = responseData.NetHashesPerSecond;

            _a.totalCoinsMined = responseData.TotalCoinsMined;

            let social_api_url = 'https://www.cryptocompare.com/api/data/socialstats/?id=' + coinData.Id;
            request.get(social_api_url, (err, resp, bd) => {
                if(err || !bd) {
                    console.log(err);
                    return;
                }
                let responseData2 = JSON.parse(bd).Data;
                _a.twitter = {
                    followers: responseData2.Twitter.followers,
                    link: responseData2.Twitter.link
                };
                _a.reddit = {
                    subscribers: responseData2.Reddit.subscribers,
                    activeUsers: responseData2.Reddit.active_users,
                    link: responseData2.Reddit.link
                };
                _a.facebook = {
                    likes: responseData2.Facebook.likes,
                    link: responseData2.Facebook.link
                };
                _a.code = (!responseData2.CodeRepository.List[0]) ? {} : {
                    stars: responseData2.CodeRepository.List[0].stars,
                    language: responseData2.CodeRepository.List[0].language,
                    lastUpdate: responseData2.CodeRepository.List[0].last_update,
                    link: responseData2.CodeRepository.List[0].url
                };
            });
        });
    }); 
    setTimeout(function() { // bad hack, use async 
        let dataToOutput = JSON.stringify(finalData);
        fs.writeFile(relativeDir + 'offeringData.json', dataToOutput, 'utf8', function() {
            console.log('finally done!');
        });
    }, 60000);
}

