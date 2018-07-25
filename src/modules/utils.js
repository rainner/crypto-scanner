/**
 * Common utils
 */
module.exports = {

  // shuffle an array
  shuffle( o ) {
    for ( let j, x, i = o.length; i; j = parseInt( Math.random() * i ), x = o[--i], o[i] = o[j], o[j] = x );
    return o;
  },
}
