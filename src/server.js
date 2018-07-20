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

// global data
let accounts  = [];
let tracklist = [];
let tweets    = [];
let limit     = 50;

// server handlers
const base = path.join( __dirname, '..' );
const app  = http.createServer( requestHandler( base ) );
const io   = socket.listen( app );

// pass accounts and tweet data to all clients
const tweetHandler = ( tweet ) => {
  let { name, profile } = tweet;
  logger.line().info( 'New tweet from:', '@'+ profile );

  if ( !accounts.filter( a => a.profile === profile ).length ) {
    accounts.push( { name, profile } );
    io.emit( 'accounts', accounts );
  }
  tweets.unshift( tweet );
  if ( tweets.length > limit ) tweets = tweets.slice( 0, limit );
  io.emit( 'tweet', tweet );
};

// add new twitter account to be tracked
const trackAccount = ( profile ) => {
  if ( tracklist.filter( t => t.profile === profile ).length ) return;
  let tracker = twitterHandler( profile ).init( 120, tweetHandler );
  tracklist.push( tracker );
};

// stop and remove tracked twitter account
const untrackAccount = ( profile ) => {
  let tracker = tracklist.filter( t => t.profile === profile ).shift();
  if ( !tracker ) return;

  tracker.stop();
  accounts = accounts.filter( a => a.profile !== profile );
  tracklist = tracklist.filter( t => t.profile !== profile );
  tweets = tweets.filter( t => t.profile !== profile );

  io.emit( 'accounts', accounts );
  io.emit( 'tweets', tweets );
};

// greet new client
io.on( 'connection', ( client ) => {

  // send current data to client
  logger.line().info( 'Socket client connected:', client.id );
  client.emit( 'connected', client.id );
  client.emit( 'accounts', accounts );
  client.emit( 'tweets', tweets );

  // client wants to track new account
  client.on( 'track', profile => {
    logger.line().info( 'Tracking twitter account:', profile );
    trackAccount( profile );
  });

  // client wants to remove existing account
  client.on( 'untrack', profile => {
    logger.line().info( 'Removing twitter account:', profile );
    untrackAccount( profile );
  });
});

// start listening
app.listen( parseInt( port ) );
logger.line().success( 'App running at', 'http://localhost:'+ port +' ...' );

// start fetching tweets
for ( let i = 0; i < twitterProfiles.length; ++i ) {
  let profile = twitterProfiles[ i ];
  let timeout = 1000 * ( i * 1 );
  setTimeout( () => { trackAccount( profile ) }, timeout );
}
