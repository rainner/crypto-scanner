/**
 * Update favicon
 */
(function() {
  let link  = document.querySelector( 'link[rel*="icon"]' ) || document.createElement( 'link' );
  link.type = 'image/x-icon';
  link.rel  = 'shortcut icon';
  link.href = 'favicon.ico?nc='+ Date.now();
  document.getElementsByTagName( 'head' )[ 0 ].appendChild( link );
})();

/**
 * Notifications helper
 */
const notify = {
  _audio: new Audio( 'public/audio/notification.mp3' ),
  _queue: [],

  hasSupport() {
    return ( window && ( 'Notification' in window ) );
  },
  canNotify() {
    if ( !this.hasSupport() ) return false;
    if ( Notification.permission !== 'granted' ) return false;
    return true;
  },
  permission() {
    if ( !this.hasSupport() ) return;
    Notification.requestPermission().then( response => {} );
  },
  add( title, body, icon, link, audio ) {
    this._queue = this._queue.filter( n => n.title !== title );
    this._queue.push( { title, body, icon, link, audio } );
  },
  watch() {
    setTimeout( this.watch.bind( this ), 1000 );
    if ( !this.canNotify() || !this._queue.length ) return;
    let { title, body, icon, link, audio } = this._queue.shift();
    let a = new Notification( title, { body, icon } );
    a.addEventListener( 'click', e => { e.preventDefault(); window.open( link, '_blank' ); } );
    if ( audio ) this._audio.play();
  },
};

/**
 * Setup Vue instance
 */
new Vue({
  el: '#app',

  // app data
  data: {
    socket: null,
    connected: false,
    clientId: '',
    tweets: [],
    accounts: [],
    search: '',
  },

  // computed methods
  computed: {

    // filter tweets list
    tweetsList() {
      let list = this.tweets.slice();
      let search = this.searchStr();

      if ( search && search.length > 1 ) {
        let reg = new RegExp( '\\b'+ search, 'gi' );
        list = list.filter( t => reg.test( [ t.name, t.profile, t.text ].join( ' ' ) ) );
      }
      return list;
    },

    // filter accounts list
    accountsList() {
      let list = this.accounts.slice();
      let search = this.searchStr();

      if ( search && search.length > 1 ) {
        let reg = new RegExp( '\\b'+ search, 'gi' );
        list = list.filter( a => reg.test( [ a.name, a.profile ].join( ' ' ) ) );
      }
      return list;
    },
  },

  // custom methods
  methods: {

    // get cleaned search string
    searchStr() {
      return String( this.search || '' ).replace( /[^\w]+/g, '' ).replace( /[\r\n\s\t]+/g, ' ' ).trim();
    },

    //
    searchList( list, search ) {
      let reg = new RegExp();
    },

    // open web link
    openLink( link ) {
      window.open( link, '_blank' );
    },

    // open twitter link for a profile
    openProfile( profile ) {
      this.openLink( 'https://twitter.com/'+ profile );
    },

    // add new account to be tracked
    addAccount() {
      if ( !this.socket ) return;
      const profile = String( prompt( 'Enter a Twitter @handle', '' ) || '' ).replace( /[^\w]+/g, '' );
      if ( !profile ) return;
      if ( !confirm( 'Start tracking tweets from @'+ profile +'?' ) ) return;
      this.socket.emit( 'track', profile );
    },

    // clear and remove account from list
    removeAccount( profile ) {
      if ( !this.socket ) return;
      if ( !confirm( 'Stop tracking tweets from @'+ profile +'?' ) ) return;
      this.socket.emit( 'untrack', profile );
    },

    // setup socket object and handlers
    setupSocket() {
      this.socket = new io.connect( `${location.protocol}//${location.host}` );

      // socket open
      this.socket.on( 'connect', () => {
        this.connected = true;
      });

      // socket closed
      this.socket.on( 'disconnect', () => {
        this.connected = false;
      });

      // client connected, get id
      this.socket.on( 'connected', clientId => {
        this.clientId = clientId;
      });

      // get available tweets data
      this.socket.on( 'tweets', tweets => {
        this.tweets = Array.isArray( tweets ) ? tweets.slice() : this.tweets;
      });

      // get list of accounts being tracked
      this.socket.on( 'accounts', accounts => {
        this.accounts = Array.isArray( accounts ) ? accounts.slice() : this.accounts;
      });

      // get latest new tweet data
      this.socket.on( 'tweet', tweet => {
        let tweets = this.tweets.slice();
        tweets.unshift( tweet );
        this.tweets = tweets;
        // show tweet notification
        let { name, text, avatar, link } = tweet;
        let isnew = ( this.tweets.length > this.accounts.length );
        if ( isnew ) notify.add( name, text, avatar, link, true );
      });
    },

    // watch for notifications
    setupPermissions() {
      notify.permission();
      notify.watch();
    },
  },

  // vue instance mounted
  mounted() {
    this.setupSocket();
    this.setupPermissions();
  },
});


