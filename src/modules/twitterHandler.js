/**
 * Handles fetching and parsing tweets for a profile.
 */
const debug     = process.env.DEBUG | 0;
const logger    = require( './consoleLogger' )( debug );
const scraper   = require( './twitterScraper' );
const fetch     = require( 'node-fetch' );
const jsdom     = require( 'jsdom' );
const { JSDOM } = jsdom;

// wrapper function
module.exports = function twitterHandler( profile, limit ) {

  // request params
  const host     = 'twitter.com';
  const endpoint = 'https://'+ host +'/'+ profile;
  const headers  = { // look ma, i'm a browser.
    'Host': host,
    'Referer': endpoint,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'DNT': 1,
  };

  // handler object
  return {
    // profile ref
    profile,

    // accumulated tweets for this account
    _tweets: [],

    // timeout to wait before fetching again (secs)
    _timeout: 300,

    // handler for new tweets
    _handler: null,

    // settimeout id
    _sto: null,

    // fetch tweets from account
    _fetchTweets() {
      this.stopTimer();
      logger.line().success( 'Fetching', endpoint +' ...' );

      fetch( endpoint, { headers } )
        .then( response => {
          let status = response.status | 0;
          let html   = response.text();

          if ( status >= 400 && status < 500 ) {
            throw '('+ status +') Endpoint is unavailable '+ endpoint +' !';
          }
          return html;
        })
        .then( html => {
          this._parseTweets( html );
          this._sto = setTimeout( this._fetchTweets.bind( this ), 1000 * this._timeout );
        })
        .catch( err => {
          logger.line().error( 'Error:', err.message || 'Could not fetch remote url ('+ endpoint +').' );
        });
    },

    // parse data returned from fetch
    _parseTweets( html ) {
      const limitCount = parseInt( limit ) || 1;
      const virtualConsole = new jsdom.VirtualConsole();
      const doc = new JSDOM( html, { virtualConsole } ).window.document;
      const tweets = scraper( doc, { limitCount } );

      for ( let tw of tweets ) {
        if ( this._tweets.filter( t => t.id === tw.id ).length ) continue;
        this.profile = tw.profile;
        this._tweets.push( tw );
        this._handler( tw );
      }
    },

    // get all tweets
    getTweets() {
      return this._tweets.slice();
    },

    // flush tweets
    flushTweets() {
      this._tweets = [];
      return this;
    },

    // stop fetching
    stopTimer() {
      if ( this._sto ) clearTimeout( this._sto );
      return this;
    },

    // start fetching tweets from account
    init( timeout, handler ) {
      this._timeout = parseInt( timeout ) || this._timeout;
      this._handler = ( typeof handler === 'function' ) ? handler : function() {};
      this._fetchTweets();
      return this;
    },

    // stop and flush
    stop() {
      this.stopTimer();
      this.flushTweets();
    },
  }
}
