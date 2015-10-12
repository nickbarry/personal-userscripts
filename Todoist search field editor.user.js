// ==UserScript== 
// @name 		 Todoist search field editor 
// @namespace 	 http://nicholasbarry.com/ 
// @version 	 0.1 
// @updateURL    https://github.com/nickbarry/personal-userscripts/raw/master/Todoist%20search%20field%20editor.user.js
// @downloadURL  https://github.com/nickbarry/personal-userscripts/raw/master/Todoist%20search%20field%20editor.user.js
// @description  Allows a user to edit the current search query in Todoist 
// @author 	 	 Nicholas Barry 
// @match 		 http*://*todoist.com/app* 
// @require 	 http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js 
// @grant 		 none 
// ==/UserScript== 

this.$ = this.jQuery = jQuery.noConflict(true); 

$(document).ready(function() { 
    var $quickFind = $('#quick_find input'); 
    function editSearch(){ 
        $quickFind.val($quickFind.attr('placeholder')); 
    } 

    $quickFind.focus(editSearch); 
});