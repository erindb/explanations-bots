function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}
var startTime;

var nQs = 10;

$(document).ready(function() {
  showSlide("consent");
  startTime = Date.now();
  $("#mustaccept").hide();
  $.post("http://www.stanford.edu/~erindb/cgi-bin/get-mturk-results.php");
});

var generatingPair = shuffle([
  ["Beth is very tired", "she is going to stay up until 3am"],
  ["Alex hates computers", "he just bought a computer"]
])[0];
/*var generatingEvent = shuffle([
  "Beth is very tired",
  "Beth is going to stay up until 3am",
  "Alex hates computers",
  "Alex just bought a computer"
])[0];*/

var events = generatingPair.slice(0);

var unexplained = events.slice(0);

var ungrammatical = [];

var experiment = {
  data: {},
  
  instructions: function() {
    if (turk.previewMode) {
      $("#instructions #mustaccept").show();
    } else {
      showSlide("instructions");
      $("#begin").click(function() { experiment.trial(0); })
    }
  },
  
  trial: function(qNumber) {

    //add an explanation of the checkboxes, iff there are checkboxes
    if (qNumber == 0) {
      $("#ungrammaticalExplanation").hide();
    } else {
      $("#ungrammaticalExplanation").show();
    }

/*    //list known events and checkboxes for user-generated ones
    //in case they're ungrammatical
    var eventParagraphs = ""
    for (var i=0; i<events.length; i++) {
      var e = events[i];
      var checkbox = i>1 ? '<input type="checkbox" id="ungrammatical' + i + '"/></span>' : "";
      eventParagraphs += "<tr><td>" + checkbox + "</td><td>" + caps(e) + ".</td></tr>";
    }
    $("#events").html(eventParagraphs);*/

    //list known events
    var eventParagraphs = ""
    for (var i=0; i<events.length; i++) {
      var e = events[i];
      var checkbox;
      if (ungrammatical.indexOf(e) == -1 & generatingPair.indexOf(e) == -1) {
        checkbox = '<input type="checkbox" id="ungrammatical' + i + '"/>';
      } else {
        checkbox = "";
      }
      eventParagraphs += "<p><h3>" + caps(e) + "." + checkbox + "</h3></p>";
    }
    $("#events").html(eventParagraphs);

    if (unexplained.length == 0) {
      unexplained = generatingPair.slice(0);
    }

    explainEvent = sample(unexplained);
    unexplained.splice(unexplained.indexOf(explainEvent), 1);
    $("#explainEvent").html(caps(explainEvent));
    $(".lowercaseExplainEvent").html(explainEvent);

    showSlide("trial");
    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));
    $('#helpSection').hide();

    if (qNumber == 0) {
      $("#helpButton").hide();
    } else {
      $("#helpButton").show();
    }

    $(".err").hide();

    var bail = false;

    $(".continue").click(function() {
      var explanation = $('#explanation').val();
      var bailReason = $('input:radio[name=help]:checked').val();
      if (explanation.length < 1 & bailReason == null) {
        if (qNumber == 0) {
          $("#firstErr").show();
        } else if (bail) {
          $("#lastErr").show();
        } else {
          $("#laterErr").show();
          $(".optionalBreak").hide();
        }
      } else {
        $(".continue").unbind("click");
        $(".err").hide();
        if (bailReason == null) {
          experiment.data[qNumber] = {
            explainEvent:explainEvent,
            explanation: explanation
          };
          for (var i=0; i<events.length; i++) {
            if ($("#ungrammatical" + i).is(':checked')) {
              ungrammatical.push(events[i]);
            }
          }
        } else {
          var otherText = $("#otherText").val();
          experiment.data[qNumber] = {
            explainEvent:explainEvent,
            explanation:explanation,
            bailReason:bailReason,
            otherText:otherText
          };
        }
        if (!explanation == "") {
          events.splice(events.indexOf(explainEvent)+1, 0, explanation);
          unexplained.push(explanation);
        }
        $('input:radio[name=help]:checked').val("");
        $('#explanation').val("");
        $('#otherText').val("");
        $('input:radio[name=help]').attr('checked',false);
        if (qNumber + 1 < nQs) {
          experiment.trial(qNumber+1);
        } else {
          experiment.questionaire();
        }
      }
    })

    $("#helpButton").click(function() {
      $("#helpSection").show();
      $("#helpButton").hide();
      bail = true;
    })
  },
  
  questionaire: function() {
    //disable return key
    $(document).keypress( function(event){
     if (event.which == '13') {
        event.preventDefault();
      }
    });
    //progress bar complete
    $('.bar').css('width', ( "100%"));
    showSlide("questionaire");
    $("#formsubmit").click(function() {
      rawResponse = $("#questionaireform").serialize();
      pieces = rawResponse.split("&");
      var age = pieces[0].split("=")[1];
      var lang = pieces[1].split("=")[1];
      var comments = pieces[2].split("=")[1];
      if (lang.length > 0) {
        experiment.data["language"] = lang;
        experiment.data["comments"] = comments;
        experiment.data["age"] = age;
        experiment.data["events"] = events;
        experiment.data["ungrammatical"] = ungrammatical;
        var endTime = Date.now();
        experiment.data["duration"] = endTime - startTime;
        showSlide("finished");
        setTimeout(function() { turk.submit(experiment.data) }, 1000);
      }
    });
  }
}
  
