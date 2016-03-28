// ==UserScript==
// @name         Feedly filter
// @version      1.2.5
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
    /* Temp items */

    /* Pop culture */ 'kardashian','kanye','downton','walking dead','whiskey tango foxtrot',
    'tv','game of throne',' hbo','hbo ','oscars','grammy','golden globe','emoji','emoticon','Beyoncé',
    'Jay Z',

    /* Technology */ 'nvidia','mac ','[mac]','ipad','for mac','hdr ',' hdr','acer','apple watch','smartwatch',
    'hoverboard','streaming video','playstation','sims','video stream','osx','os x',
    ' ios','watchband','tweetdeck','t-mobile','sprint','raspberry pi','macs','cyanogen',
    'imessage','tech news digest','linux','game console','gaming','video game','videogame',
    'computer game','arduino','spotify','at&t','xbox','coolest cooler','pebble','minecraft',
    'blackberry','iphone se','macbook','lightning cable','atari','game boy','gameboy','divergent',

    /* Sports */ 'basketball','nba','football','nfl','adidas','reebok','nike','draftking',
    'fanduel',

    /* Blog-specific */ 'jalopnik',"today's best deals",'kotaku','deadspin','gawker',
    'wrongometer','menu plan','gabfest','jezebel',

    /* Specific issues */ 'beer','wine','heineken',
    'transgender','transsexual','trans ','transphobic','transphobia',
    'vape','vaping',

    /* Misc */ 'mcdonald\'s'];
    // Consider: 'iphone','apple'

var detectArticleTimer = window.setInterval(detectArticles, 300);

// HOISTED FUNCTIONS
// Caching function - create function that caches the results of identical previous calls to that function
function memoize(f) {
  var cache = {};

  return function() {
    var arg_str = JSON.stringify(arguments);
    cache[arg_str] = cache[arg_str] || f.apply(f, arguments);
    return cache[arg_str];
  };
}

// Test whether a particular string contains one of the terms I'd like to exclude
var hasExcludedTerm = memoize(function(string){
    var result = {hasTerm: false}; // assume title does not have an excluded term
    for(var i = 0; i < termsToExclude.length; i++){
        if(string.toLowerCase().indexOf(termsToExclude[i].toLowerCase()) !== -1){ // title has [i] excluded term in it
            result.hasTerm = true;
            break;
        }
    }
    if(result.hasTerm){
        result.term = termsToExclude[i];
    }
    return result;
});

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
        return false
    }
}

// Once articles are detected, set a regular interval to review and hide newly-loaded articles that match exclusion terms
function detectArticles(){
    var articles = articlesExist();
    if(articles){
        window.setInterval(reviewArticles, 5000);
        //console.log('articles length: ',articles.length);
        window.clearInterval(detectArticleTimer);
    }
}

// Marks articles as hidden and read if they have an excluded term in them
function reviewArticles(){
    var articles = articlesExist();
    //console.log('articles length: ',articles.length);
    articles.forEach(function(article){
        var title = article.dataset.title;
        var excludedTermCheck = hasExcludedTerm(title);
        if(excludedTermCheck.hasTerm){
            console.log(excludedTermCheck.term + ": " + title);
            article.children[0].children[3].click();
        }
    });
}