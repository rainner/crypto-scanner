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
  'BittrexExchange',
  'Liqui_Exchange',
  'btercom',
  'YobitExchange',
  'BitZExchange',
  'BitGrail',
  'Poloniex',
  'krakenfx',
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
  'JoelKatz',
  'Ripple',
  'coindesk',
  'BTCTN',
]);
