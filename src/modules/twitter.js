/**
 * Handles fetching and parsing tweets for a profile.
 */
const scraper   = require( './scraper' );
const fetch     = require( 'node-fetch' );
const jsdom     = require( 'jsdom' );
const { JSDOM } = jsdom;

/**
 * Twitter Handler wrapper
 * @param {String}  handle  Twitter account handle
 * @param {Number}  limit   Max number of tweets to pass back to handler
 */
module.exports = function twitter( handle, limit ) {

  // sanitize and check input
  handle = String( handle || '' ).replace( /[^\w]+/g, '' ).trim();
  limit  = parseInt( limit ) || 1;

  if ( !handle ) throw 'Must provide a valid Twitter handle.';

  // twitter account handler object
  return {
    uid     : '',      // account user id (int)
    handle  : handle,  // account @handle
    name    : handle,  // account display name
    avatar  : '',      // account avatar url
    tweets  : [],      // accumulated tweets
    last    : 0,       // last fetch time
    delay   : 120,     // prevent fetch (secs)

    onError : null,    // external callback for when there is an error
    onTweet : null,    // external callback for when new tweets are fetched
    onFetch : null,    // external callback for when fetching starts
    onDone  : null,    // external callback for when fetching is done

    // fetch tweets from account
    fetchTweets( delay ) {
      const now = Date.now();
      const elapsed = ( now - this.last ) / 1000;

      this.delay = parseInt( delay ) || this.delay;
      if ( this.delay && elapsed < this.delay ) return this._done();

      const host = 'twitter.com';
      const endpoint = 'https://'+ host +'/'+ this.handle;
      const headers = { // look ma, i'm a browser.
        'Host': host,
        'Referer': endpoint,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': 1,
      };
      // send request ...
      if ( typeof this.onFetch === 'function' ) {
        this.onFetch( this.handle );
      }
      fetch( endpoint, { headers } )
      .then( this._handleResponse.bind( this ) )
      .then( this._parseTweets.bind( this ) )
      .catch( this._error.bind( this ) );
      this.last = now;
    },

    // get account info
    accountInfo() {
      let { uid, handle, name, avatar } = this;
      return { uid, handle, name, avatar };
    },

    // get all tweets
    getTweets() {
      return this.tweets.slice();
    },

    // get last tweet
    lastTweet() {
      return this.tweets.slice().shift();
    },

    // flush tweets
    flushTweets() {
      this.tweets = [];
      return this;
    },

    // handle response data from fetch
    _handleResponse( response ) {
      let status = response.status | 0;
      let html   = response.text();
      if ( !status || !html ) throw 'Could not fetch tweets for account @'+ this.handle +'.';
      if ( status >= 400 && status < 500 ) throw '('+ status +') Endpoint is unavailable for account @'+ this.handle +'.';
      return html;
    },

    // parse data returned from fetch
    _parseTweets( html ) {
      if ( !html ) return this._done();
      // parse tweets from html
      const vc     = new jsdom.VirtualConsole();
      const doc    = new JSDOM( html, { virtualConsole: vc } ).window.document;
      const tweets = scraper( doc, { limitCount: limit } );

      for ( let tw of tweets ) {
        // tweet already added
        if ( this.tweets.filter( t => t.id === tw.id ).length ) continue;
        // update profile data with tweet data
        this.uid    = tw.uid;
        this.handle = tw.handle;
        this.name   = tw.name;
        this.avatar = tw.avatar;
        this.tweets.unshift( tw );
        this._tweet( tw );
      }
      this._done();
    },

    // pass error to external handler
    _error( err ) {
      this._done();
      if ( typeof this.onError === 'function' ) {
        this.onError( err.message || 'Problem fetching tweets from account @'+ this.handle +'.' );
      }
    },

    // pass tweet to external handler
    _tweet( tw ) {
      if ( typeof this.onTweet === 'function' ) {
        this.onTweet( tw );
      }
    },

    // pass handle to external handler
    _done() {
      if ( typeof this.onDone === 'function' ) {
        this.onDone( this.handle );
      }
    },

  }
}
