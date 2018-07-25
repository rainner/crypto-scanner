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
    defaultTitle: document.title,
    newCount: 0,
    tweets: [],
    accounts: [],
    checking: [],
    search: '',
  },

  // watch methods
  watch: {
    search() {
      if ( this.search && this.$refs.searchInput ) {
        this.$refs.searchInput.focus();
      }
    }
  },

  // computed methods
  computed: {

    // search tweets list
    tweetsList() {
      let list = this.tweets.slice();
      let search = String( this.search || '' ).replace( /[^\w]+/g, '' ).replace( /[\r\n\s\t]+/g, ' ' ).trim();

      if ( search && search.length > 1 ) {
        let reg = new RegExp( '\\b'+ search, 'gi' );
        list = list.filter( t => reg.test( [ t.name, t.handle, t.text ].join( ' ' ) ) );
        window.scrollTo( 0, 0 );
      }
      return list;
    },

    // accounts list with checking indicator
    accountsList() {
      return this.accounts.slice().map( a => {
        a.checking = this.checking.filter( c => c === a.handle ).length;
        return a;
      });
    },
  },

  // custom methods
  methods: {

    // open web link
    openLink( link ) {
      window.open( link, '_blank' );
    },

    // open twitter link for a handle
    openProfile( handle ) {
      this.openLink( 'https://twitter.com/'+ handle );
    },

    // count number of tweets for a handle
    countTweets( handle ) {
      return this.tweets.filter( t => t.handle === handle ).length;
    },

    // add new account to be tracked
    addAccount() {
      if ( !this.socket ) return;
      const handle = String( prompt( 'Enter a Twitter @handle', '' ) || '' ).replace( /[^\w]+/g, '' );
      if ( !handle ) return;
      if ( !confirm( 'Start tracking tweets from @'+ handle +'?' ) ) return;
      this.socket.emit( 'track', handle );
    },

    // clear and remove account from list
    removeAccount( handle ) {
      if ( !this.socket ) return;
      if ( !confirm( 'Stop tracking tweets from @'+ handle +'?' ) ) return;
      this.socket.emit( 'untrack', handle );
    },

    // trigger browser notification
    sendNotification( tweet ) {
      if ( document.hasFocus() ) {
        this.newCount = 0;
        return;
      }
      let { name, text, avatar, link } = tweet;
      notify.add( name, text, avatar, link, true );
      this.newCount++;
    },

    // update page title
    updateTitle() {
      if ( this.newCount ) { document.title = '('+ this.newCount +') '+ this.defaultTitle; }
      else { document.title = this.defaultTitle; }
    },

    // setup socket object and handlers
    setupSocket() {
      this.socket = new io.connect( `${location.protocol}//${location.host}` );

      // socket open
      this.socket.on( 'connect', () => {
        this.connected = true;
        this.checking = [];
      });

      // socket closed
      this.socket.on( 'disconnect', () => {
        this.connected = false;
        this.checking = [];
      });

      // client connected, get id
      this.socket.on( 'connected', clientId => {
        this.clientId = clientId;
      });

      // get list of accounts being checked
      this.socket.on( 'checking', list => {
        this.checking = Array.isArray( list ) ? list : [];
      });

      // get list of accounts being tracked
      this.socket.on( 'accounts', accounts => {
        if ( !Array.isArray( accounts ) ) return;
        this.accounts = accounts;
      });

      // get available tweets data
      this.socket.on( 'tweets', tweets => {
        if ( !Array.isArray( tweets ) ) return;
        this.tweets = tweets;
        this.updateTitle();
      });

      // get latest new tweet data
      this.socket.on( 'tweet', tweet => {
        this.sendNotification( tweet );
        this.updateTitle();
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

    // reset count and title on doc focus
    document.addEventListener( 'focus', e => {
      this.newCount = 0;
      this.updateTitle();
    });
    // reset search when hitting ESC key
    document.addEventListener( 'keyup', e => {
      let code = e.keyCode || e.key || 0;
      if ( code === 27 ) this.search = '';
    });
  },
});


