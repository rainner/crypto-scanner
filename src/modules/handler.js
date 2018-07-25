/**
 * HTTP server request handler
 */
const logger = require( './logger' )( true );
const path   = require( 'path' );
const url    = require( 'url' );
const fs     = require( 'fs' );

// common content types for some extensions
const extMap = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword'
};

// serve files from a base path
module.exports = function( base ) {

  return function( req, res ) {
    const pathname = url.parse( req.url ).pathname;
    const file     = ( !pathname || pathname === '/' ) ? '/index.html' : pathname;
    const ext      = path.parse( file ).ext;
    const fpath    = path.join( base, file );
    const ctype    = extMap[ ext ] || 'text/plain';
    const host     = ( req.headers && 'host' in req.headers ) ? req.headers.host : 'localhost';

    logger.line().log(
      [ 'blue', '['+ host +']' ],
      [ 'green', req.method ],
      [ 'white', file +' ...' ]
    );

    fs.exists( fpath, ( exist ) => {
      if ( !exist ) {
        res.statusCode = 404;
        res.end( `404: Request not found (${req.url}).` );
        return;
      }
      fs.readFile( fpath, ( err, data ) => {
        if ( err ) {
          res.statusCode = 500;
          res.end( `500: Server error.` );
          console.error( err );
          return;
        }
        res.statusCode = 200;
        res.setHeader( 'Content-type', ctype );
        res.end( data );
      });
    });
  }
}
