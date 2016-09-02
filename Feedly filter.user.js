// ==UserScript==
// @name         Feedly filter - BETA
// @version      3.2.24
// @update	 https://github.com/nickbarry/personal-userscripts/raw/master/Feedly%20filter.user.js
// @description  Filter out feedly articles according to certain keywords
// @author       Nico Barry
// @match        http://feedly.com/*
// @require 	 http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @run-at       document-idle
// ==/UserScript==
/* jshint -W097 */
'use strict';

// Latest version here:
// https://github.com/nickbarry/personal-userscripts/blob/master/Feedly%20filter.user.js

this.$ = this.jQuery = jQuery.noConflict(true);

var FilterMaker = (function(){
  var FilterMaker = function(){
    this.uniqueArticleTitles = [];
    this.latestArticle = 0;
    this.currentUrl = '';
    this.counter = 0; // A counter I can use for various testing scenarios

    this.$filterBar = $('<input type="text" id="article-filter">');
    this.$filterBar.on('keyup',this.applyFilter.bind(this));

    this.$markFilteredAsRead = $('<button id="mark-filtered-as-read">Mark filtered articles as read</button>');
    this.$markFilteredAsRead.on('click',this.markFilteredAsRead.bind(this));

    this.filteredArticles = {show: [], hide: []};

    //this.filterBar = document.createElement('input'); // Create a filterBar element I can use
    //var type = document.createAttribute('type'); // Add attributes to the filterBar
    //type.value = 'text';
    //var id = document.createAttribute('id');
    //id.value = 'article-filter';
    //this.filterBar.setAttributeNode(type);
    //this.filterBar.setAttributeNode(id);
    //
    //this.filterBar.addEventListener('keyup',this.applyFilter.bind(this));
  }

  // PRIVATE VARIABLES
  var termsToExclude = [
    /* Temp items */ /\brio\b/,/epi-?pen/,

    /* Pop culture */ /kardashian/,/kanye/,/downton/,/walking dead/,/whiskey tango foxtrot/,/\boprah/,/kate hudson/,
    /\btvs?\b/,/game of throne/,/\bhbo\b/,/oscar/,/grammy/,/golden globe/,/emoji/,/emoticon/,/drake/,/kelly clarkson/,
    /Jay Z/,/divergent/,/lil'? kim/,/netflix/,/\brapper/,/ke[s$]ha/,/instagram/,/tidal/,/mtv/,/coachella/,/espn/,
    /cable box/,/\broku/,/samantha bee/,/full frontal/,/kylie jenner/,/bruce jenner/,/doctor who/,/beyonc[eé]/,/beyhive/,
    /hunger games/,/tony award/,/tony'?s/,/hollywood/,/powerball/,/captain america/,/bieber/,/george r\. ?r\. martin/,
    /half[ -]?life/,/\bthor\b/,/season \d/,/orange.*new black/,/the bachelor/,/yelchin/,/taylor swift/,/suicide squad/,
    /star trek/,/trekkie/,/ghost ?buster/,/power ranger/,/warcraft/,/trump time capsule/,/big brother/,/bet award/,
    /season premiere/,/season \d/,/broadway/,/america's got talent/,/zelda/,/binge[ -]?watch/,/pokemon/,/mr. robot/,
    /appelbaum/,/\bolympi/,/\bpoké/,/pok[ée]mon/,/hulu/,/phelps/,/whopperito/,/no man['’]?s sky/,/frank ocean/,
    /kobe bryant/,/mlb/,/song exploder/,/book club/,/\bwwe\b/,/burqini/,/\bsyfy\b/,/stranger things/,

    /* Politics */ /hastert/,

    /* Apple stuff */ /\bi?macs?\b/,/ipad/,/apple watch/,/smartwatch/,/\bos ?x\b/,/ios game/,/apple game/,/ios app/,
    /\bios/,/watchband/,/macbook/,/lightning cable/,/apple music/,/icloud/,/\bmacs\b/,/imessage/,
    /\bmac ?os\b/,/\bapple/,/iphone/,/\bopera\b/,/safari/,

    /* Technology */ /nvidia/,/\bhdr\b/,/\bacer\b/,/ps4/,/\bnes\b/,/kindle/,/chromecast/,/snapchat/,/plasma/,/\bfios/,
    /hoverboard/,/streaming video/,/playstation/,/\bsims\b/,/video stream/,/tweetdeck/,/t-mobile/,/whatsapp/,
    /sprint/,/raspberry pi/,/cyanogen/,/tech news digest/,/linux/,/game console/,/gaming/,/video ?game/,
    /computer game/,/arduino/,/spotify/,/at&t/,/x-?box/,/coolest cooler/,/pebble/,/minecraft/,/gamer/,/\be-?book/,
    /blackberry/,/atari/,/game ?boy/,/photography/,/canon/,/gamestop/,/nintendo/,/ubuntu/,/surround sound/,/spotify/,
    /photos of the week/,

    /* Sports */ /basketball/,/\bnba\b/,/football/,/\bnfl\b/,/adidas/,/reebok/,/nike/,/draftking/,
    /fanduel/,/soccer/,/sports/,/golf/,/warriors/,/world cup/,/kevin durant/,

    /* Blog-specific */ /jalopnik/,/today's best deals/,/kotaku/,/deadspin/,/this week's top downloads/,/policy daily/,
    /wrongometer/,/menu plan/,/gabfest/,/jezebel/,/this week's most popular posts/,/^\[?sponsor/,/dear prudence/,
    /adequate man/,/io9/,/black flag/,/feminist cheat sheet/,/remains of the day/,/cape watch/,/what tnw is reading/,
    /linkdump/,/^quoted$/,/editor's letter/,/open thread/,/news quiz/,/mic news/,/news alert/,/week in culture/,
    /breakfast table/, / edition$/,/foxtrot alpha/,/pay what you want/,/the garage/,/the edge:/,/atlantic daily/,
    /feministing reads/,/culture podcast/,/gadget ?lab podcast/,/friday favorites/,

    /* food */
    /juice cleanse/,/juicer/,/\bkfc\b/,/beer/,/wine/,/heineken/,/bud[ -]light/,/coffee/,/caffeine/,/espresso/,
    /starbucks/,/mcdonald['’]?s/,

    /* Brands, shopping */
    /amazon deals/,/pepsi/,

    /* Social and health issues */
    /transgender/,/transsex/,/trans /,/trans-s/,/transpho/,/trans$/,/menstrua/,/slut[ -]sham/,/zika/,/abortion/,
    /plus[- ]size/,

    /* Drugs etc. */
    /vape/,/vaping/,/\bedibles/,/pot edible/,/marijuana edible/,/weed edible/,/weed butter/,/pot butter/,/420/,/stoner/,
    /cigar/,/e-?cig/,

    /* Misc */ /ticketmaster/,
  ];

  // Once articles are detected, set a regular interval to review and hide newly-loaded articles that match exclusion terms
  FilterMaker.prototype.detectArticles = function(){
    var articles = articlesExist();
    if(articles){
      window.setInterval(this.reviewArticles.bind(this), 1000);
      window.clearInterval(this.detectArticleTimer);
    }
  };

  FilterMaker.prototype.pageChangeReset = function(memoizedFn){
    this.currentUrl = window.location.href;
    this.latestArticle = 0;
    this.uniqueArticleTitles.length = 0;
    this.getArticlesToHide.clear();
    if(memoizedFn && typeof memoizedFn === 'function') { // If there is a memoized function passed in, clear its cache
      memoizedFn.clear();
    }
    if(!document.getElementById('article-filter')){
      this.insertFilter()
    }
    if(document.getElementById('article-filter').value){
      this.applyFilter();
    }
  }

  // Marks articles as hidden and read if they have an excluded term in them
  FilterMaker.prototype.reviewArticles = function(){
    if(this.currentUrl !== window.location.href) {this.pageChangeReset();}

    var articles = articlesExist();
    var titles = articles.map(function(article){
      return article.dataset.title;
    });

    if(titles.length > this.latestArticle){ // If new articles have loaded
      console.log('New articles have loaded!');
      this.getArticlesToHide.clear();
      for(var i = this.latestArticle; i < titles.length; i++){
        var title = titles[i];

        if(isTitleUnique(title,this.uniqueArticleTitles)){
          this.uniqueArticleTitles.push(title); // If it is unique, add it to the array

          var excludedTermCheck = hasExcludedTerm(title); // Check if title has a term I'd like to exclude
          if(excludedTermCheck.hasTerm){
            removeTitle(articles[i],title,excludedTermCheck);
          }
        }else{ // If the title isn't unique, i.e. this is a duplicate of a more recent article in the queue
          removeTitle(articles[i],title,{term: 'Duplicate'});
        }
      }
      this.latestArticle = i; // Update my latest article tracker, which should now be equal
      // to the length of titles (i.e., one index value higher than the highest actual index
      // in titles).

      if(document.getElementById('article-filter').value){
        this.applyFilter();
      }
    }
  }

  FilterMaker.prototype.applyFilter = function applyFilter(){
    var filterText = document.getElementById('article-filter').value;
    this.filteredArticles = this.getArticlesToHide(filterText);
    this.$markFilteredAsRead.text(`Mark ${this.filteredArticles.show.length} filtered articles as read`);
    this.filteredArticles.show.forEach(article => article.style.display = '');
    this.filteredArticles.hide.forEach(article => article.style.display = 'none');
  }

  FilterMaker.prototype.getArticlesToHide = (function(){
    var allArticles = [];

    var getArticlesToHide = function(term){
      if('/' === term[0] && '/' === term[term.length - 1]){ // regex
        term = new RegExp(term.slice(1,-1), 'i'); // Create new regex
        console.log(term);
      }else{
        term = term.toLowerCase();
      }
      allArticles = allArticles.length ? allArticles : articlesExist(); // Fetch titles if they don't exist
      var articlesToHide = allArticles
          .filter(article => !~article.dataset.title.toLowerCase().search(term));
      var articlesToShow = allArticles
          .filter(article => ~article.dataset.title.toLowerCase().search(term));
      return {
        hide: articlesToHide,
        show: articlesToShow
      };
    };

    getArticlesToHide.clear = function(){
      allArticles.length = 0;
    };

    return getArticlesToHide;
  })();

  FilterMaker.prototype.insertFilter = function(){
    $('#feedlyTitleBar').append(this.$filterBar, this.$markFilteredAsRead);
    //document.getElementById('feedlyTitleBar').insertBefore(this.filterBar,null);
  };

  FilterMaker.prototype.markFilteredAsRead = function(){
    if(this.filteredArticles.show !== null){ // If it's null, we haven't used the filter bar yet, and we shouldn't do anything
      var confirmed = this.filteredArticles.show.length < 20 ? true : confirm(`You're sure you want to mark ${this.filteredArticles.show.length} articles read?`);
      if(confirmed){
        var that = this;
        $(this.filteredArticles.show).each(function(i,article){
          removeTitle(article,$(article).data('title'),{term: 'Marked read'});
          that.$filterBar.val('');
          that.applyFilter();
        });
      }
    }
  };

  return FilterMaker;

  // PRIVATE, HOISTED FUNCTIONS
  // Caching function
  function memoize(f) {
    var cache = {};

    var memoizedFn = function() {
      var arg_str = JSON.stringify(arguments);
      cache[arg_str] = cache[arg_str] || f.apply(f, arguments);
      return cache[arg_str];
    };

    memoizedFn.clear = function(){ // allow user to clear the cache of the memoized function
      cache = {};
    };

    return memoizedFn;
  }

  // Test whether a particular string contains one of the terms I'd like to exclude
  function hasExcludedTerm(titleString){
    var result = {hasTerm: false},
      titleLower = titleString.toLowerCase(); // assume title does not have an excluded term
    for(var i = 0; i < termsToExclude.length; i++){
      if(titleLower.search(termsToExclude[i]) !== -1){ // title has [i] excluded term in it
        result.hasTerm = true;
        result.term = termsToExclude[i];
        break;
      }
    }

    return result;
  }

  function isTitleUnique(title,arr){
    return !~arr.indexOf(title); // true if the title is NOT found in the array
  }

  // Convert array-like object to array
  function toArray(arrayLikeObj){
    return [].slice.call(arrayLikeObj);
  }

  // Checks if the articles have loaded yet in Feedly; if so, returns the article titles array
  function articlesExist(){
    var articles = toArray(document.getElementsByClassName('u0Entry'));
    if(articles.length){
      return articles;
    }else{
      return false;
    }
  }

  function removeTitle(articleHtmlObj,title,excludedTermCheck){
    console.log(excludedTermCheck.term + ": " + title);
    articleHtmlObj.children[0].children[3].click();
  }
})();

var Filter = new FilterMaker();

Filter.detectArticleTimer = window.setInterval(Filter.detectArticles.bind(Filter), 300);