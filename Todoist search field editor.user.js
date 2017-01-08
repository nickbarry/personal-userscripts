// ==UserScript==
// @name 		 Todoist modifications
// @namespace 	 http://nicholasbarry.com/
// @version 	 0.3.3
// @updateURL    https://github.com/nickbarry/personal-userscripts/raw/master/Todoist%20search%20field%20editor.user.js
// @downloadURL  https://github.com/nickbarry/personal-userscripts/raw/master/Todoist%20search%20field%20editor.user.js
// @description  Allows a user to edit the current search query in Todoist
// @author 	 	 Nicholas Barry
// @match 		 http*://*todoist.com/app*
// @require 	 http://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @grant 		 none
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);

// EVENT LISTENER FUNCTIONS
// This sets the placeholder text of the search field as the contents of the search field (i.e. the field's value)
function editSearch($quickFind) {
  // If there isn't already a value in the quickFind field
  if (!$quickFind.val()) {
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

  if (~taskDateClasses.indexOf('date_overdue')) {
    const dateText = $taskDate.text();
    if (~dateText.indexOf('yesterday')) { // If it's due yesterday, then it's 1 day overdue
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

function determineNewPriority(taskPriorityGradient, taskIsOverdueXDays) {
  return taskPriorityGradient
    .match(/(?:\d+): ?(?:\d+)/g)                            // Get each separate priority tupel
    .map(str => str.match(/\d+/g))                          // Separate out the numbers
    .sort((a, b) => b[0] - a[0])                            // Sort in descending order of days late
    .filter(tupel => tupel[0] <= taskIsOverdueXDays)[0][1]; // Get priority tupel with greatest days late, and get its corresponding priority
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

  // If the task text has a priority gradient, such as [{7:2},{14:1}], and the task is overdue
  if (taskPriorityGradient && taskIsOverdueXDays) {
    const newPriority = determineNewPriority(taskPriorityGradient, taskIsOverdueXDays);

    // The UI uses a 1-4 priority scale, with 1 as the highest priority. But the CSS classes use a 4-1 scale, with 4 as
    // the most important. So we need to convert between them.
    const newPriorityClass = `priority_${5 - newPriority}`;

    // Discover the current priority assigned to this task
    const currentPriority = $task.attr('class').match(/priority_[1234]/)[0];

    $task.removeClass(currentPriority).addClass(newPriorityClass);
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

$(document).ready(function () {
  const $quickFind = $('#quick_find input');
  modifyAllTaskPriorities();

  // Update the contents of the search field when the user clicks into it
  $quickFind.focus(() => editSearch($quickFind));

  $('#filters_list').on('click', 'li.menu_clickable', () => {
    // Display the query associated with a filter whenever the user clicks a filter
    displayFilterQuery($quickFind);

    // Update the priorities of all the tasks
    modifyAllTaskPriorities();
  });
});
