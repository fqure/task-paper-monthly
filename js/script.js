// Wait until the form has loaded entirely.
var documentReady = new Promise($(document).ready);

// Load the year, month, and items values from localStorage,
// or get the current year and month and the default item set.
var loadFromCookiesOrDefaults = function (){

  return new Promise(function (resolve){
    if (localStorage.getItem('items')){
      resolve({
        items : localStorage.getItem('items'),
        year  : localStorage.getItem('year'),
        month : localStorage.getItem('month')
      });
    } else {
      $.get('default-item-list.txt', function (data) {
        var today = new Date();

        resolve({
          items : data,
          year  : today.getFullYear(),
          month : today.getMonth()
        });
      });
    }
  });

};

// Populate the form from the loaded data,
// generate the TaskPaper month from the items field, and
// store the results in localStorage.
var populateAndProcessAndRememberFormData = function (data){

  var yearsContainer  = $('#years'),
      anyYearField    = $('input[name="year"]'),
      monthsContainer = $('#months'),
      anyMonthField   = $('input[name="month"]'),
      itemsField      = $('#items'),
      taskpaperMonth  = $('#taskpaper-month');

  var generateTaskPaperMonth = function (){

    // Read the form data; prepare to generate a month.
    var selectedYear   = $('input[name="year"]:checked'),
        selectedMonth  = $('input[name="month"]:checked'),
        year           = selectedYear.val(),
        month          = selectedMonth.val() - 1, // Months are zero-indexed.
        itemsText      = itemsField.val(),
        itemsArray     = [],
        items          = {},
        numberOfDays   = new Date(year, month, 0).getDate() + 1, // Days are also zero-indexed.
        generatedMonth = '';

    // Build an array of items from the contents of the textarea.
    // Split the textarea by digits followed by newlines.
    itemsArray = itemsText.split(/(\d+):?\n/m);

    // Hack off the first (empty) array item.
    itemsArray.shift();

    // Create an associative array by iterating through even and odd
    // array items. (Odd are day numbers, even are that day's items.)
    $.each(itemsArray, function(key, value) {
      if (key%2 === 0) {
        items[itemsArray[key]] = itemsArray[key+1];
      }
    });

    // Turn each 'items' value in the object into an array split by newlines.
    $.each(items, function(key, value) {
      items[key] = items[key].trim().split('\n');
    });

    // Loop through each of the days and include the items therein.
    for (var day = 1; day <= numberOfDays; day++) {

      // Get the day name.
      var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          dayName  = dayNames[new Date(year, month, day).getDay()];

      // Add the day heading:

      // 1. Add one to the day, since Javascript days are 0-indexed.
      dayNumber = day;

      // 2. Add a newline if we're not on the first day.
      if (dayNumber > 1)
        generatedMonth += '\n';

      // 3. Add a zero for days under 10.
      if (dayNumber < 10)
        generatedMonth += '0';

      // 4. Add the day number itself, a colon, and a newline.
      generatedMonth += dayNumber + ' ' + dayName + ':';

      // If this day contains items, print them.
      if (items[dayNumber]) {
        $.each(items[dayNumber], function(key, value) {

          // If the line starts with two spaces or a tab character, make it a note.
          if (value.substring(0, 2) === '  ' || value.substring(0, 1) === '\t')
            generatedMonth += '\n\t\t' + value;

          // If the line starts with a dash and a space, make it a todo.
          // (This is not the suggested syntax, but that's OK!)
          else if (value.substring(0, 2) === '- ')
            generatedMonth += '\n\t' + value;

          // Otherwise, make it a todo.
          else
            generatedMonth += '\n\t- ' + value;

        });
      }

      // If we're on the last day of the month, generated a link back here!
      if (dayNumber === numberOfDays)
        generatedMonth += '\n\t- generate new Taskpaper month\n\t\thttp://matthewmcvickar.github.io/taskpaper-month-generator';

    }

    // Print generated TaskPaper month to the screen.
    taskpaperMonth.val(generatedMonth);

    // Save values to localStorage.
    localStorage.setItem('year',  selectedYear.val()  );
    localStorage.setItem('month', selectedMonth.val() );
    localStorage.setItem('items', itemsField.val()    );
  };


  // // // // // // // // // // // // // // // // // //


  // Initial setup:

  // 1. Populate year buttons with current and next year.
  var thisYear = new Date().getFullYear(),
      nextYear = thisYear + 1;

  $('#year-this')
    .attr('id', 'year-' + thisYear)
    .attr('value', thisYear)
    .after($('<label for="year-' + thisYear + '">' + thisYear + '</label>'));

  $('#year-next')
    .attr('id', 'year-' + nextYear)
    .attr('value', nextYear)
    .after($('<label for="year-' + nextYear + '">' + nextYear + '</label>'));

  // 2. Select the loaded year.
  $('#year-' + data.year).attr('checked', true);

  // 3. Select the loaded month.
  $('#month-' + data.month).attr('checked', true);

  // 4. Populate items field with loaded items.
  // 5. Give items field focus.
  itemsField.val(data.items).focus();

  // 6. Generate TaskPaper month for the first time.
  generateTaskPaperMonth();


  // // // // // // // // // // // // // // // // // //


  // Make the Tab key insert an actual tab in the textarea.
  itemsField.keydown( function(key) {
    var cursorPosition  = itemsField.get(0).selectionStart,
        itemsFieldValue = itemsField.val();

    // If it's the Tab key, insert two spcaes instead.
    if (key.keyCode === 9) {
      key.preventDefault();

      // Splice the tab character in at the cursor position.
      itemsField.val(spliceText(itemsFieldValue, cursorPosition, 0, '\t'));

      // Move the cursor position two characters ahead (after the tab).
      itemsField.get(0).setSelectionRange(cursorPosition + 1, cursorPosition + 1);

      return false;
    }
  });

  // Regenerate TaskPaper month on subsequent updates.
  anyYearField.on('change', generateTaskPaperMonth);
  anyMonthField.on('change', generateTaskPaperMonth);
  itemsField.on('keyup', generateTaskPaperMonth);
};

documentReady
  .then(loadFromCookiesOrDefaults)
  .then(populateAndProcessAndRememberFormData);

// Function to splice a value into a string at a given index.
// http://stackoverflow.com/a/21350614/187051
function spliceText(str, index, count, add) {
  return str.slice(0, index) + add + str.slice(index + count);
}