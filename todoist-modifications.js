// ==UserScript==
// @name 		 Todoist modifications
// @namespace 	 http://nicholasbarry.com/
// @version 	 0.4.11
// @updateURL    https://github.com/nickbarry/personal-userscripts/raw/master/Todoist%20search%20field%20editor.user.js
// @downloadURL  https://github.com/nickbarry/personal-userscripts/raw/master/Todoist%20search%20field%20editor.user.js
// @description  Allows a user to edit the current search query in Todoist
// @author 	 	 Nicholas Barry
// @match 		 http*://*todoist.com/app*
// @require 	 http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @require 	 https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.5.0/bluebird.core.js
// @grant 		 none
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

// EVENT LISTENER FUNCTIONS
// This sets the placeholder text of the search field as the contents of the search field (i.e. the field's value)
function editSearch($quickFind) {
  // If there isn't already a value in the quickFind field
  if (!$quickFind.val() && $quickFind.attr('placeholder').toLowerCase() !== 'quick find') {
    $quickFind.val($quickFind.attr('placeholder'));
  }
}

// When the user clicks a filter, the filter's parameters are placed in the url. This function takes those parameters and
// places them in the search box, to allow the user to edit the parameters easily.
function displayFilterQuery($quickFind) {
  const url = window.location.href;
  const filterQuery = decodeURIComponent(
    url.slice(url.indexOf('#agenda') + 10) // Enough characters after the beginning of #agenda to catch just the query
  );
  $quickFind.val(filterQuery);
}

function taskOverdueByXDays($task) {
  // Figure out if the task is overdue (or due today, or has no due date)
  const $taskDate = $task.find('span.date');
  const taskDateClasses = $taskDate.attr('class');

  if ($taskDate.length && ~taskDateClasses.indexOf('date_overdue')) { // If the task HAS a date, and it's overdue
    const dateText = $taskDate.text();
    if (~dateText.toLowerCase().indexOf('yesterday')) { // If it's due yesterday, then it's 1 day overdue
      return 1;
    } else { // Otherwise subtract the due date from the current time
      // Detect whether the date text contains a year. If it doesn't, we'll need to add the current year before converting to a Date object.
      const dueDate = dateText.split(' ').length === 3 ?
        new Date(dateText) :
        new Date(`${dateText} ${new Date().getFullYear()}`);
      return Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return 0; // If the task isn't overdue
}

function determineNewPriority({ taskText, taskPriorityGradient, taskIsOverdueXDays, currentPriority }) {
  if (taskPriorityGradient) { // If there's an explicit priority gradient, prefer to use that
    const relevantPriorityGradientTupels = taskPriorityGradient
      .match(/(?:\d+): ?(?:\d+)/g)                      // Get each separate priority tupel
      .map(str => str.match(/\d+/g))                    // Separate out the numbers
      .sort((a, b) => b[0] - a[0])                      // Sort in descending order of days late
      .filter(tupel => tupel[0] <= taskIsOverdueXDays); // Filter out any priority tupels that apply to tasks that are MORE overdue than the current task
    return relevantPriorityGradientTupels.length ? // check if there are any relevant tupels
      relevantPriorityGradientTupels[0][1] : // Get priority tupel with greatest days late, and get its corresponding priority
      currentPriority; // If there are no relevant tupels, i.e. the task is overdue but not overdue enough to be increased in priority, return current priority
  }

  // If there's no explicit priority gradient, then compare how overdue it is to its task frequency. (Tasks should only
  // be sent to this function if the task is a repeating task.) An overdue repeating task should be upgraded in priority
  // according to this rule: Calculate the task's period (e.g. it repeats every 8 days). For each period it's late,
  // increase its priority (up to priority 1).
  const periodMatch = taskText.match(/^(\d*)d(?:ly)?:/i) || // Text like '6d: Pack..." at the beginning of the task indicates a period
    taskText.match(/^(th|[mtwfsu]):/i); // Text like 'm: Pack...' also indicates a weekly period (e.g. on mondays)
  if (periodMatch) {
    let period;
    if (periodMatch[1] === '') { // Daily tasks are written "d: Pack..." or "dly: pack" instead of "1d: Pack..."; the regex will find an empty string
      period = 1;
    } else if (periodMatch[1].match(/\d+/)) { // else if it's a numeric digit(s)
      period = +periodMatch[1];
    } else { // else it's a day of the week thing, like a Monday task ('m: Pack...')
      period = 7;
    }
    const calculatedPriority = currentPriority - Math.floor( // Start with the current priority...
        taskIsOverdueXDays / period              // ...and subtract off however many multiples of the period the task is currently overdue. I.e., a weekly task that's 17 days late is two periods late
      );
    return Math.max(1, calculatedPriority); // Make sure not to return a meaningless priority, i.e. anything less than 1
  } else { // If there's no explicitly noted period...
    return currentPriority; // ...then return the current priority, since it isn't easy to discover the priority otherwise
    // todo: It might be possible to programmatically hover over the recurring icon, which causes a modal to appear. That modal
    // describes the period of the task. This is low priority because I tend to mark tasks in the task title if they're recurring.
  }
}

// The user may have included some text in the task title that describes an escalating series of priorities for the task
// if the task is increasingly late. For example, the task may be priority 3, but it should become priority 2 if it's more
// than 2 weeks late, and priority 1 if it's more than 4 weeks late. This function detects the syntax used to indicate that,
// and updates the task's class to make it appear the correct priority. Unfortunately, this is a brittle change, since
// Todoist doesn't know about that change, and many user actions will cause Todoist to wipe out these changes. So I'll
// need to have this function run frequently.
function modifyTaskPriority($task) {
  const taskText = $task.find('span.sel_item_content').text();
  const taskHasPriorityGradient = taskText.match(/\[(?:\d+: ?\d+, ?)*(?:\d+: ?\d+)]/);
  const taskPriorityGradient = taskHasPriorityGradient ? taskHasPriorityGradient[0] : null;
  const taskIsOverdueXDays = taskOverdueByXDays($task);
  const taskIsRepeating = (taskPriorityGradient || !taskIsOverdueXDays) ?
    null : // If there's an explicit priority gradient, or if the task isn't even overdue, we don't care if it's a repeating task
    !!$task.find('img.recurring_icon').length; // If there's a recurring icon, then it's a repeating task, which we can use to infer a priority gradient

  // If the task text has a priority gradient, such as [{7:2},{14:1}], and the task is overdue
  if (taskIsOverdueXDays && (taskPriorityGradient || taskIsRepeating)) {
    // Discover the current priority assigned to this task
    const currentPriority = 5 - $task.attr('class').match(/priority_([1234])/)[1]; // Convert from 4-1 system for css classes to 1-4 system used in UI

    const newPriority = determineNewPriority({ taskText, taskPriorityGradient, taskIsOverdueXDays, currentPriority });

    // The UI uses a 1-4 priority scale, with 1 as the highest priority. But the CSS classes use a 4-1 scale, with 4 as
    // the most important. So we need to convert between them.
    const newPriorityClass = `priority_${5 - newPriority}`;

    if (+newPriority < currentPriority) { // determineNewPriority may infer a priority that's the same as the current priority, or less than it (lower priority i.e. higher number), in which case we should always defer to the existing priority
      $task.removeClass(`priority_${5-currentPriority}`).addClass(newPriorityClass);
      $task.css('background-color', '#fcf2d9');
      console.log(`Task upgraded from priority ${currentPriority} to ${newPriority}: ${taskText}`);
    }
  }
}

function modifyAllTaskPriorities() {
  // Update priorities
  const $task_items = $('.task_item');
  $task_items.each((i, task) => modifyTaskPriority($(task)));

  // Sort tasks by priority
  const $tasksContainer = $('#editor').find('ul.items');
  $task_items.sort((a, b) => {
    const aPriority = $(a).attr('class').match(/priority_(\d)/)[1];
    const bPriority = $(b).attr('class').match(/priority_(\d)/)[1];

    // Sort in descending order of priority; recall that in the classes they use, priority 4 is equivalent to priority 1 in the user interface.
    return bPriority - aPriority;
  });
  $task_items.detach().appendTo($tasksContainer);
}

// Media downloader ------------------------------------
//function addModule(url, varName, callback) {
//  const script = document.createElement('script');
//  script.setAttribute('src', url);
//  script.addEventListener('load', function() {
//    const script = document.createElement("script");
//    script.textContent = `console.log('testtest');window.${varName}=${varName}.noConflict(true);console.log('testtest');(${callback.toString()})();`;
//    document.body.appendChild(script);
//  }, false);
//  document.body.appendChild(script);
//}

// TODO: Rename or something; this takes an array of functions, not promises.
async function eachPromise(asyncFns) {
  for (let i = 0; i < asyncFns.length; i++) {
    await asyncFns[i]();
  }
}

function getPosition(element) {
  var xPosition = 0;
  var yPosition = 0;

  while(element) {
    xPosition += (element.offsetLeft - element.scrollLeft + element.clientLeft);
    yPosition += (element.offsetTop - element.scrollTop + element.clientTop);
    element = element.offsetParent;
  }
  return { x: xPosition, y: yPosition };
}

const selectors = {
  noteClass: '.note_text',
  noteContent: '.note_content',
};

class DownloadMedia {
  static async investigate() {
    console.log('Beginning investigation');
    // TODO: Find, click, and await the "Fetch older comments" link
    const $notes = $(selectors.noteClass);
    eachPromise($notes.map((i, note) => (() => DownloadMedia.processOneNote(note))));
  }

  static async processOneNote(note) {
    const $note = $(note);
    const noteContentNodes = $note.find(selectors.noteContent)[0].childNodes;
    const noteHasOneLink = noteContentNodes.length === 1 && noteContentNodes[0].tagName === 'A';
    if (noteHasOneLink) {
      const $a = $(noteContentNodes[0]);
      // TODO:
      // Start from the bottom note since that's in view
      // Detect position
      // Move cursor to hover over it
      // Detect the pop-up loading icon and then the image
        // When the image is ready, trigger download (maybe via ctrl-s, or by grabbing the image that's displaying)
          // What about videos?
          // Maybe don't need to wait for the image to load; maybe good as soon as the spinner appears
            // But what about multi-image posts? Also need to handle them
      // Delete note
      // If the note wasn't a downloadable/deletable, scroll the page so I can hover the mouse over the next link?
      console.log($a.attr('href'));
    }
  }
}

function isSeparatedByDateView() {
  const overdueSectionList = $('.section_overdue');
  return Boolean(overdueSectionList.length);
}

$(document).ready(function () {
  const $quickFind = $('#quick_find input');
  // Update the priorities of all the tasks, but not if the view has separate date buckets (which doesn't play nicely
  // with my `modify` function)
  if (!isSeparatedByDateView()) {
    modifyAllTaskPriorities();
  }

  // Update the contents of the search field when the user clicks into it
  $quickFind.focus(() => editSearch($quickFind));

  $('#filters_list').on('click', 'li.menu_clickable', () => {
    // Display the query associated with a filter whenever the user clicks a filter
    displayFilterQuery($quickFind);

    // Update the priorities of all the tasks, but not if the view has separate date buckets (which doesn't play nicely
    // with my `modify` function)
    if (!isSeparatedByDateView()) {
      modifyAllTaskPriorities();
    }
  });

//  // Media downloader
//  const taskRegex = /#task%2F105707030$/;
//  if (taskRegex.test(window.location.href)) {
//    window.setTimeout(DownloadMedia.investigate, 2000);
//  }
});
