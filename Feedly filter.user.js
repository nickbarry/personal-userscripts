// ==UserScript==
// @name         Feedly filter
// @version      1.1.0
// @update	 https://github.com/nickbarry/personal-userscripts/raw/master/Feedly%20filter.user.js
// @description  Filter out feedly articles according to certain keywords
// @author       Nico Barry
// @match        http://feedly.com/*
// @run-at       document-idle
// ==/UserScript==
/* jshint -W097 */
'use strict';

// Latest version here:
// https://github.com/nickbarry/personal-userscripts/blob/master/Feedly%20filter.user.js

var termsToExclude = [
    /* Pop culture */ 'kardashian','kanye','downton','walking dead','whiskey tango foxtrot',
    'tv','game of throne','hbo','oscars','grammy','golden globe',

    /* Technology */ 'nvidia','mac ','[mac]','for mac','hdr','acer','apple watch','smartwatch',
    'hoverboard','streaming video','playstation','sims','video stream','osx','os x',
    ' ios','watchband','tweetdeck','t-mobile','sprint','raspberry pi','macs','cyanogen',
    'imessage','tech news digest','linux','game console','gaming console','video game',
    'computer game',

    /* Sports */ 'basketball','nba','football','nfl',

    /* Blog-specific */ 'jalopnik',"today's best deals",'kotaku','deadspin','gawker',
    'wrongometer','menu plan','gabfest',

    /* Specific issues */ 'beer','wine',
    'transgender','transsexual','trans ','transphobic','transphobia'

    /* Temp items */ ];
    // Consider: 'iphone','apple'

var detectArticleTimer = window.setInterval(detectArticles, 300);

// HOISTED FUNCTIONS
function memoize(f) {
  var cache = {};

  return function() {
    var arg_str = JSON.stringify(arguments);
    cache[arg_str] = cache[arg_str] || f.apply(f, arguments);
    return cache[arg_str];
  };
}

var hasExcludedTerm = memoize(function(string){
    var hasTerm = false; // assume title does not have an excluded term
    for(var i = 0; i < termsToExclude.length; i++){
        if(string.toLowerCase().indexOf(termsToExclude[i].toLowerCase()) !== -1){ // title has [i] excluded term in it
            hasTerm = true;
            break;
        }
    }
    return hasTerm;
});

function toArray(arrayLikeObj){
	return [].slice.call(arrayLikeObj);
}

function articlesExist(){
    var articles = toArray(document.getElementsByClassName('u0Entry'));
    if(articles.length){
        return articles;
    }else{
        return false
    }
}

function detectArticles(){
    var articles = articlesExist();
    if(articles){
        window.setInterval(reviewArticles, 5000);
        //console.log('articles length: ',articles.length);
        window.clearInterval(detectArticleTimer);
    }
}

function reviewArticles(){
    var articles = articlesExist();
    console.log('articles length: ',articles.length);
    articles.forEach(function(article){
        var title = article.dataset.title;
        if(hasExcludedTerm(title)){
            console.log(title);
            article.children[0].children[3].click();
        }
    });
}

function findByTitleTermX(term){
    return function(el){
        return el.dataset.title.indexOf(term) !== -1;
    }
}