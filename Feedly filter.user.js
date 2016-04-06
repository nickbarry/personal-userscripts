// ==UserScript==
// @name         Feedly filter
// @version      1.3.6
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

    /* Pop culture */ /kardashian/,/kanye/,/downton/,/walking dead/,/whiskey tango foxtrot/,
    /\btv\b/,/game of throne/,/\bhbo\b/,/oscar/,/grammy/,/golden globe/,/emoji/,/emoticon/,/Beyoncé/,
    /Jay Z/,/divergent/,/lil'? kim/,/netflix/,/rapper/,/ke[s$]ha/,/instagram/,/tidal/

    /* Apple stuff */ /\bmacs?\b/,/ipad/,/apple watch/,/smartwatch/,/\bos ?x\b/,/ios game/,/apple game/,
    /\bios/,/watchband/,/iphone se/,/macbook/,/lightning cable/,/apple music/,/icloud/,/macs/,/imessage/,
    // Consider: 'iphone','apple' (But right now I don't want to block out news about

    /* Technology */ /nvidia/,/\bhdr\b/,/acer/,
    /hoverboard/,/streaming video/,/playstation/,/\bsims\b/,/video stream/,/tweetdeck/,/t-mobile/,
    /sprint/,/raspberry pi/,/cyanogen/,/tech news digest/,/linux/,/game console/,/gaming/,/video ?game/,
    /computer game/,/arduino/,/spotify/,/at&t/,/x-?box/,/coolest cooler/,/pebble/,/minecraft/,
    /blackberry/,/atari/,/game ?boy/,/camera/,

    /* Sports */ /basketball/,/\bnba\b/,/football/,/\bnfl\b/,/adidas/,/reebok/,/nike/,/draftking/,
    /fanduel/,

    /* Blog-specific */ /jalopnik/,/today's best deals/,/kotaku/,/deadspin/,/gawker/,
    /wrongometer/,/menu plan/,/gabfest/,/jezebel/,/this week's most popular posts/,

    /* Specific issues */ /beer/,/wine/,/heineken/,
    /transgender/,/transsex/,/trans /,/trans-s/,/transpho/,/trans$/, // Trying not to rule out trans-pacific partnership
    /plus[- ]size/,
    /vape/,/vaping/,
    /zika/,

    /* Misc */ /mcdonald's/];

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
var hasExcludedTerm = memoize(function(titleString){
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
        return false;
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