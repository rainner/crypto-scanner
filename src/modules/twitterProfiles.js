/**
 * Crypto related twitter accounts
 */
const shuffle = ( o ) => {
	for ( let j, x, i = o.length; i; j = parseInt( Math.random() * i ), x = o[--i], o[i] = o[j], o[j] = x );
  return o;
};
module.exports = shuffle([
  'CoinbaseAPI',
  'coinbase',
  'binance',
  'lightning',
  'ethereum',
  'BittrexExchange',
  'Liqui_Exchange',
  'btercom',
  'bitfinex',
  'YobitExchange',
  'BitZExchange',
  'BitGrail',
  'Poloniex',
  'krakenfx',
  'CryptoCurrEncyX',
  'OKEx_',
  'OKCoin',
  'cex_io',
  'nova_exchange',
  'HuobiGroup',
  'Bitstamp',
  'BitMEXdotcom',
  'balajis',
  'brian_armstrong',
  'IOHK_Charles',
  'aantonop',
  'TheRealXinxi',
  'SatoshiLite',
  'officialmcafee',
  'justinsuntron',
  'cz_binance',
  'VitalikButerin',
  'ErikVoorhees',
  'justinvendetta',
  'bobbyclee',
  'JoelKatz',
  'DCGco',
  'Ripple',
  'decentraland',
  'Cointelegraph',
  'coindesk',
  'BTCTN',
]);
