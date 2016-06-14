// ==UserScript==
// @name         Bookstrap help link redirecter
// @version      0.1
// @description  Redirect the help link
// @author       Nico Greenarry
// @include        http://bookstrap.makersquare.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  function replaceGetHelp(){
    var $getHelp = $('.get-help-tab');

    var $newHelp = $('<a href="http://helpdesk.makerpass.com/groups/mks-40/tickets" target="_blank">Get Help</a>').addClass('get-help-tab help-tab ng-scope');
    $getHelp.hide().after($newHelp);
  }

  setTimeout(replaceGetHelp,5000);
})();