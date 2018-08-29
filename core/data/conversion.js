/**
 * conversion.js
 * convert/preserve canonical names for coins 
 */
module.exports = {
    /**
     * Takes ticker as input, outputs canonical version
     */
    parseTicker: function(ticker) {
        let _cn = ticker;
        switch(_cn) {
            case "NANO":
            case "XRB":
                _cn = "XRB";
                break;
            case "MIOTA":
            case "IOTA":
            case "IOT":
                _cn = "IOT";
                break;
        }
        return _cn;
    }
}