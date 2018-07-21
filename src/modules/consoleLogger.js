/**
 * Console log helper with color support.
 */

// const logger = require( './consoleLogger' )( true );
// logger.line();
// logger.log( ['blue', '...'], ['red', '...'] );
// logger.log( { color: 'red', text: '...' } )
// logger.log( '...' )

module.exports = function logger( enabled ) {

  return {

    // format message color
    _format( color, text ) {
      let c = '37m';

      switch ( color ) {
        case 'black'   :  c = '30m';  break;
        case 'red'     :  c = '31m';  break;
        case 'green'   :  c = '32m';  break;
        case 'yellow'  :  c = '33m';  break;
        case 'blue'    :  c = '34m';  break;
        case 'magenta' :  c = '35m';  break;
        case 'cyan'    :  c = '36m';  break;
        case 'white'   :  c = '37m';  break;
      }
      return '\x1b[' + c + text + '\x1b[0m';
    },

    // log colored message from arguments
    log() {
      if ( !enabled ) return;
      let data = [];

      Array.from( arguments ).forEach( arg => {

        if ( Array.isArray( arg ) ) {
          let color = arg.length ? arg.shift() : 'white';
          let text  = arg.length ? arg.shift() : '...';
          data.push( this._format( color, text ) );
        }
        else if ( typeof arg === 'object' ) {
          let color = arg.color || 'white';
          let text  = arg.text  || '...';
          data.push( this._format( color, text ) );
        }
        else if ( typeof arg === 'string' ) {
          data.push( this._format( 'white', arg ) );
        }
      });
      console.log( data.join( ' ' ) );
      return this;
    },

    // print empty line
    space() {
      this.log( ' ' );
      return this;
    },

    // print a divider line
    line() {
      this.log( [ 'grey', '-'.repeat( 80 ) ] );
      return this;
    },

    // blue message helper
    info( label, text ) {
      this.log( [ 'blue', label ], [ 'white', text ] );
      return this;
    },

    // yellow message helper
    warn( label, text ) {
      this.log( [ 'yellow', label ], [ 'white', text ] );
      return this;
    },

    // red message helper
    error( label, text ) {
      this.log( [ 'red', label ], [ 'white', text ] );
      return this;
    },

    // green message helper
    success( label, text ) {
      this.log( [ 'green', label ], [ 'white', text ] );
      return this;
    },

  }
};

