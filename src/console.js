/**
 * Twitter scraper
 */
const logger          = require( './modules/consoleLogger' )( true );
const twitterProfiles = require( './modules/twitterProfiles' );
const twitterHandler  = require( './modules/twitterHandler' );
const totalAccounts   = twitterProfiles.length;
const fetchTime       = 300;

// show a tweet in console
const printTweet = ( tweet ) => {
  let d = new Date( tweet.time );
  logger
    .line()
    .success( 'New Tweet From:', tweet.name +' (@'+ tweet.profile +')' )
    .info( 'Link:', tweet.link )
    .info( 'Posted:', d.toDateString() )
    .space()
    .log( tweet.text )
    .space();
};

// print init header
logger
  .line()
  .warn( 'Checking Twitter for crypto related tweets from '+ totalAccounts +' accounts ...', '' )
  .info( 'Checking every:', Math.floor( fetchTime / 60 ) +' minutes ...' )
  .space();

// fetch tweets for all accounts on file
for ( let i = 0; i < totalAccounts; ++i ) {
  let profile = twitterProfiles[ i ];
  let timeout = 1000 * ( i * 1 );
  setTimeout( () => { twitterHandler( profile ).init( fetchTime, printTweet ) }, timeout );
}


