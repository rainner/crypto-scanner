/**
 * Node server using socket.io
 */
require( 'dotenv' ).config();

const debug   = process.env.DEBUG | 0;
const logger  = require( './modules/logger' )( debug );
const twitter = require( './modules/twitter' );
const handler = require( './modules/handler' );
const utils   = require( './modules/utils' );
const socket  = require( 'socket.io' );
const path    = require( 'path' );
const http    = require( 'http' );
const fs      = require( 'fs' );
const port    = 3000;

// app data
let handles   = require( './store/handles.json' );
let accounts  = require( './store/accounts.json' );
let tweets    = require( './store/tweets.json' );
let tracklist = [];
let checking  = [];
let limit     = 100;
let counter   = 0;

// server handlers
const base = path.join( __dirname, '..' );
const app  = http.createServer( handler( base ) );
const io   = socket.listen( app );

// handler for logging errors
const errorHandler = ( err ) => {
  if ( err ) logger.line().error( 'Error:', err.message || err );
};

// extract accounts list from currently tracked list and sort by name (asc)
const getAccounts = () => {
  return tracklist.map( t => t.accountInfo() ).sort( ( a, b ) => {
    let _a = a.name.toUpperCase();
    let _b = b.name.toUpperCase();
    if ( _a < _b ) return -1;
    if ( _a > _b ) return 1;
    return 0;
  });
};

// save data to a file
const saveFileData = ( file, data ) => {
  const filePath = path.join( __dirname, './store/'+ file );
  const fileData = JSON.stringify( data, null, 2 );
  fs.writeFile( filePath, fileData, errorHandler );
};

// save current app data to file
const saveAppData = () => {
  accounts = getAccounts();
  saveFileData( 'accounts.json', accounts );
  saveFileData( 'tweets.json', tweets );
};

// send current accounts and tweets data to clients
const sendClientData = () => {
  accounts = getAccounts();
  io.emit( 'accounts', accounts );
  io.emit( 'tweets', tweets );
};

// add handle being checked for tweets
const addChecking = ( handle ) => {
  if ( checking.filter( h => h === handle ).length ) return;
  checking.push( handle );
};

// remove handle after cheking for tweets
const removeChecking = ( handle ) => {
  checking = checking.filter( h => h !== handle );
};

// handle a tweet fetched from a twitter object
const tweetHandler = ( tweet ) => {
  if ( tweets.filter( t => t.id === tweet.id ).length ) return;
  logger.line().warn( 'New tweet from:', tweet.name +' (@'+ tweet.handle +') !' );
  tweets.unshift( tweet );
  if ( tweets.length > limit ) tweets = tweets.slice( 0, limit );
  io.emit( 'tweet', tweet );
  sendClientData();
  saveAppData();
};

// add new twitter account to be tracked
const trackAccount = ( handle, name, fetch ) => {
  if ( !handle || tracklist.filter( t => t.handle === handle ).length ) return;
  logger.line().info( 'Tracking twitter account:', handle );
  // setup wrapper for twitter handle and add to list
  let handler     = twitter( handle, 1 );
  handler.name    = String( name || handle ).trim();
  handler.onError = errorHandler;
  handler.onTweet = tweetHandler;
  handler.onFetch = addChecking;
  handler.onDone  = removeChecking;
  if ( fetch ) handler.fetchTweets();
  tracklist.unshift( handler );
};

// remove tracked twitter account and tweets
const untrackAccount = ( handle ) => {
  if ( !handle ) return;
  logger.line().info( 'Removing twitter account:', handle );
  tracklist = tracklist.filter( t => t.handle !== handle );
  tweets = tweets.filter( t => t.handle !== handle );
  removeChecking( handle );
};

// cycle through each account handler and fetch tweets
const timeoutHandler = () => {
  if ( !tracklist.length ) return;
  let last = tracklist.length - 1;
  let handler = tracklist[ counter ];
  counter = ( counter < last ) ? ( counter + 1 ) : 0;
  handler.fetchTweets();
  io.emit( 'checking', checking );
};

// add default accounts to tracklist and start timer
const startTracking = () => {
  logger.line().info( 'Tracking loaded twitter accounts from file', '...' );

  // track previously saved list of accounts
  if ( accounts.length ) {
    accounts = utils.shuffle( accounts );
    for ( let acc of accounts ) trackAccount( acc.handle, acc.name, false );
  }
  // track default list of handles
  else if ( handles.length ) {
    handles = utils.shuffle( handles );
    for ( let handle of handles ) trackAccount( handle, '', false );
  }
  setInterval( timeoutHandler, 1000 );
};

// greet new client
io.on( 'connection', ( client ) => {
  // send current data to client
  logger.line().info( 'Socket client connected:', client.id );
  client.emit( 'connected', client.id );
  sendClientData();

  // client wants to track new account
  client.on( 'track', handle => {
    trackAccount( handle, '', true );
    sendClientData();
    saveAppData();
  });
  // client wants to remove existing account
  client.on( 'untrack', handle => {
    untrackAccount( handle );
    sendClientData();
    saveAppData();
  });
});

// start listening
app.listen( parseInt( port ) );
logger.line().success( 'App running at', 'http://localhost:'+ port +' ...' );
startTracking();
