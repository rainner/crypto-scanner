/**
 * Scrape tweets from a fetched Twitter profile
 * @param {Object}  doc      Twitter profile HTML document
 * @param {Object}  options  Filtering options
 */
module.exports = function twitterScraper( doc, options ) {

  // need a valid html document
  if ( !doc || typeof doc !== 'object' || !( 'querySelectorAll' in doc ) ) {
    throw 'Must provide a valid HTML document.';
  }

  // clean tweet text content
  const cleanTweet = ( text ) => {
    text = String( text || '' );
    text = text.replace( /[\t\r\n\s]+/g, ' ' );
    text = text.replace( /([^\s]+)(https?\:|pic\.)/g, '$1 $2' );
    text = text.replace( 'pic.twitter', 'https://pic.twitter' );
    text = text.trim();
    return text;
  };

  // merge default options with args
  let opts = Object.assign( {
    skipPinned: true,   // skip pinned tweets
    skipRetweet: true,  // skip retweets
    cleanTweets: true,  // clean whitespace
    limitCount: 3,      // limit number of tweets
  }, options );

  // look for profile avatar
  let avatar = doc.querySelector( 'img.ProfileAvatar-image' );
  avatar = avatar ? avatar.src : '';

  // look for items
  let items  = doc.querySelectorAll( 'li.stream-item' ) || [];
  let max    = opts.limitCount | 0;
  let now    = Date.now();
  let output = [];
  let count  = 0;

  // loop tweet list items
  for ( let i = 0; i < items.length; ++i ) {
    if ( max && count >= max ) break;

    // look for tweet containers
    let item    = items[ i ];
    let tweet   = item ? item.querySelector( '.js-stream-tweet' ) : null;
    let content = item ? item.querySelector( '.js-tweet-text' ) : null;

    // check a few things, skip if needed
    if ( !item || !tweet || !content ) continue;
    if ( opts.skipPinned && item.classList.contains( 'js-pinned' ) ) continue;
    if ( opts.skipRetweet && tweet.hasAttribute( 'data-retweet-id' ) ) continue;

    // check if tweet text is to be cleaned, skip if empty
    let text = opts.cleanTweets ? cleanTweet( content.textContent ) : String( content.innerHTML || '' ).trim();
    if ( !text ) continue;

    // look for rest of tweet data, skip if missing data
    let id     = tweet.getAttribute( 'data-tweet-id' ) || '';
    let uid    = tweet.getAttribute( 'data-user-id' ) || '';
    let name   = tweet.getAttribute( 'data-name' ) || '';
    let handle = tweet.getAttribute( 'data-screen-name' ) || '';
    let link   = 'https://twitter.com'+ tweet.getAttribute( 'data-permalink-path' ) || '';
    let time   = Number( item.querySelector( '.js-short-timestamp' ).getAttribute( 'data-time-ms' ) || now );
    if ( !id || !uid || !handle ) continue;

    // format time
    let d = new Date( time );
    time = d.toDateString();

    // add all data to output
    output.push( { id, uid, time, name, handle, avatar, text, link } );
    count++;
  }
  return output;
};

