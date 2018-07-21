/**
 * Node server using socket.io
 */
require( 'dotenv' ).config();

const debug           = process.env.DEBUG | 0;
const logger          = require( './modules/consoleLogger' )( debug );
const twitterProfiles = require( './modules/twitterProfiles' );
const twitterHandler  = require( './modules/twitterHandler' );
const requestHandler  = require( './modules/requestHandler' );
const socket          = require( 'socket.io' );
const path            = require( 'path' );
const http            = require( 'http' );
const port            = 3000;

// accounts and tweets tracking
let tracklist = [];
let tweets    = [];
let counter   = 0;
let limit     = 50;

// server handlers
const base = path.join( __dirname, '..' );
const app  = http.createServer( requestHandler( base ) );
const io   = socket.listen( app );

// get list of accounts being tracked and send to client
const sendData = () => {
  const accounts = tracklist.map( t => t.accountInfo() );
  io.emit( 'accounts', accounts );
  io.emit( 'tweets', tweets );
};

// handle a tweet fetched from a twitterHandler object
const tweetHandler = ( err, tweet ) => {
  if ( err ) return logger.line().error( 'TwitterHandlerError:', err );
  logger.line().warn( 'New tweet from:', tweet.name +' (@'+ tweet.handle +') !' );
  tweets.unshift( tweet );
  if ( tweets.length > limit ) tweets = tweets.slice( 0, limit );
  io.emit( 'tweet', tweet );
  sendData();
};

// add new twitter account to be tracked
const trackAccount = ( handle, fetch ) => {
  if ( !handle || tracklist.filter( t => t.handle === handle ).length ) return;
  logger.line().info( 'Tracking twitter account:', handle );
  let handler = twitterHandler( handle, tweetHandler );
  if ( fetch ) handler.fetchTweets();
  tracklist.unshift( handler );
};

// remove tracked twitter account and tweets
const untrackAccount = ( handle ) => {
  if ( !handle ) return;
  logger.line().info( 'Removing twitter account:', handle );
  tracklist = tracklist.filter( t => t.handle !== handle );
  tweets = tweets.filter( t => t.handle !== handle );
};

// add accounts to be tracked
const addAccounts = ( list ) => {
  if ( !Array.isArray( list ) ) return;
  logger.line().info( 'Adding accounts from list:', list.length | 0 );
  for ( let a of list ) {
    if ( a && a.handle ) trackAccount( a.handle );
  }
};

// cycle through each account handler and fetch tweets
const timeoutHandler = () => {
  if ( !tracklist.length ) return;
  let last = tracklist.length - 1;
  let handler = tracklist[ counter ];
  counter = ( counter < last ) ? ( counter + 1 ) : 0;
  handler.fetchTweets();
};

// greet new client
io.on( 'connection', ( client ) => {

  // send current data to client
  logger.line().info( 'Socket client connected:', client.id );
  client.emit( 'connected', client.id );
  sendData();

  // client wants to track new account
  client.on( 'track', handle => {
    trackAccount( handle, true );
    sendData();
  });

  // client wants to remove existing account
  client.on( 'untrack', handle => {
    untrackAccount( handle );
    sendData();
  });

  // merge client accounts with server list
  client.on( 'accounts', list => {
    addAccounts( list );
    sendData();
  });
});

// start listening
app.listen( parseInt( port ) );
logger.line().success( 'App running at', 'http://localhost:'+ port +' ...' );

// add default accounts to tracklist and start timer
for ( let handle of twitterProfiles ) trackAccount( handle );
setInterval( timeoutHandler, 1000 );

