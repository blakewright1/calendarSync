//This file compares the calendar of the user signed in to mine to display the times we are both available


/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById("content");
  var textContent = document.createTextNode(message + "\n");
  pre.appendChild(textContent);
}

function listUpcomingEvents(data) {
  //get list of events from my calendar
  var blakeEvents = [];
  var userEvents = [];
  var minutesNeeded = 60;
  for (var i = 0; i < data.length; i++) {
    if (data[i][0].dateTime != undefined && data[i][1].dateTime != undefined) {
      blakeEvents.push([
        dateTimeToDate(data[i][0].dateTime),
        dateTimeToDate(data[i][1].dateTime),
      ]);
    }
  }
  //get list of events from user calendar
  var maxDate = getMaxDate();
  console.log("blakesEvents: ", blakeEvents);
  console.log("maxDate: ", maxDate);
  gapi.client.calendar.events
    .list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      timeMax: maxDate.toISOString(),
      orderBy: "startTime",
    })
    .then(function (response) {
      var eventObjs = response.result.items;
      for (var i = 0; i < eventObjs.length; i++) {
        if (eventObjs[i].end.dateTime != undefined) {
          userEvents.push([
            dateTimeToDate(eventObjs[i].start.dateTime),
            dateTimeToDate(eventObjs[i].end.dateTime),
          ]);
        }
      }
      console.log("starting user events: ", userEvents);
      console.log("starting blake events: ", blakeEvents);
      // Merge calendars into one on userCalendar
      var x = 0;
      for (var i = 0; i < blakeEvents.length; i++) {
        if (x >= userEvents.length) {
          x = userEvents.length - 1;
        }
        if (blakeEvents[i][0] > maxDate) {
          //beyond a month
          break;
        } else if (blakeEvents[i][1] < userEvents[x][0]) {
          //event is before any remaining user event
          userEvents.splice(x, 0, [blakeEvents[i][0], blakeEvents[i][1]]);
        } else if (
          blakeEvents[i][0] < userEvents[x][0] &&
          blakeEvents[i][1] > userEvents[x][0]
        ) {
          //collision with blake event starting first
          userEvents[x][0] = blakeEvents[i][0];
          if (blakeEvents[i][1] > userEvents[x][1]) {
            userEvents[x][1] = blakeEvents[i][1];
          }
          x++;
        } else if (blakeEvents[i][0] > userEvents[x][1]) {
          //blakeEvent after userEvent, check blakeEvent against next userEvent
          if (x == userEvents.length - 1) {
            userEvents.push([blakeEvents[i][0], blakeEvents[i][1]]);
          } else {
            x++;
            i--;
          }
        } else {
          //collision with userEvent starting first
          if (blakeEvents[i][1] > userEvents[x][1]) {
            userEvents[x][1] = blakeEvents[i][1];
          }
          x++;
        }
      }

      console.log("merged list: ", userEvents);

      //Compare all events to find times available
      currentDate = new Date(); //starts at the current day
      currentDate.setDate(currentDate.getDate() + 1); //start looking for tomorrow
      currentDate.setHours(7); //start the day at 7am
      currentDate.setMinutes(0);
      currentDate.setSeconds(0);
      endCurrentDate = new Date(); //set the end time of current day
      endCurrentDate.setDate(endCurrentDate.getDate() + 1); //end of day tomorrow
      endCurrentDate.setHours(20); //end the day at 8pm
      endCurrentDate.setMinutes(0);
      endCurrentDate.setSeconds(0);
      var lastIndex = 0;
      while (currentDate.getDate() > userEvents[lastIndex][0].getDate()) {
        lastIndex++; //start checking for times tomorrow
      }
      while (currentDate < maxDate && lastIndex < userEvents.length - 1) {
        console.log("one while");
        if (currentDate.getDay() != 6 && currentDate.getDay() != 0) {
          //check if not weekend
          if (currentDate.getDate() == userEvents[lastIndex][0].getDate()) {
            //check if there is an event that day
            while (
              currentDate.getDate() == userEvents[lastIndex][0].getDate()
            ) {
              //run comparison and output the available time if any
              getDiff(currentDate, userEvents[lastIndex][0], minutesNeeded);
              currentDate = userEvents[lastIndex][1]; //set currentDate to end meeting for next comparison
              lastIndex++; //increment the next event to look at
              if (lastIndex >= userEvents.length) {
                break; //if no events left then break
              }
            }
            getDiff(currentDate, endCurrentDate, minutesNeeded); //run comparison between last event and end of day
          } else {
            //else there is availability the whole day
            appendPre(
              "Anytime on " +
                numberToDay(currentDate.getDay()) +
                " " +
                (currentDate.getMonth() + 1) +
                "/" +
                currentDate.getDate()
            );
          }
        } else {
          //if events on the weekend ignore those
          while (currentDate.getDate() == userEvents[lastIndex][0].getDate()) {
            lastIndex++;
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(7); //reset next day to start at 7am
        currentDate.setMinutes(0);
        endCurrentDate.setDate(endCurrentDate.getDate() + 1); //this might need to change
      }
    });
}

//calculate the last day to look for dates
function getMaxDate() {
  var maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  return maxDate;
}

function getDiff(date1, date2, minutesNeeded) {
  console.log("get diff with: ", date1, date2);
  if (
    //there is a block of minutes or hours free greater than the required meeting length
    (date1.getHours() == date2.getHours() &&
      date2.getMinutes() - date1.getMinutes() >= minutesNeeded) ||
    (date2.getHours() - date1.getHours()) * 60 -
      (date1.getMinutes() - date2.getMinutes()) >=
      minutesNeeded
  ) {
    appendPre(
      "Time available on " +
        numberToDay(date1.getDay()) +
        (date1.getMonth() + 1) +
        "/" +
        date1.getDate() +
        " between " +
        date1.getHours() +
        ":" +
        numberToMinutes(date1.getMinutes()) +
        " and " +
        date2.getHours() +
        ":" +
        numberToMinutes(date2.getMinutes())
    ); //output that block
  }
}

function dateTimeToDate(str) {
  var year = parseInt(str.substring(0, 4), 10);
  var month = parseInt(str.substring(5, 7), 10);
  var day = parseInt(str.substring(8, 10), 10);
  var hours = parseInt(str.substring(11, 13), 10);
  var minutes = parseInt(str.substring(14, 16), 10);
  var d = new Date(year, month - 1, day, hours, minutes);
  return d;
}

//convert the number (0-6) to the day of the week
function numberToDay(num) {
  if (num == 1) {
    return "Monday ";
  } else if (num == 2) {
    return "Tuesday ";
  } else if (num == 3) {
    return "Wednesday ";
  } else if (num == 4) {
    return "Thursday ";
  } else {
    return "Friday ";
  }
}

//add a zero to minutes if needed
function numberToMinutes(num) {
  if (num < 10) {
    return "0" + num;
  } else {
    return num;
  }
}
