function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.

var nQs = 10;

$(document).ready(function() {
  showSlide("consent");
  $("#mustaccept").hide();
});

var letters = ["c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n"];

var events = shuffle([
  { "a": "Beth is very tired",
    "b": "she is going to stay up until 3am" },
  { "a": "Alex hates computers",
    "b": "he just bought a computer" }
])[0];

var eventPairs = ["ab"];

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
    showSlide("trial");
    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));

    eventPairs = shuffle(eventPairs);
    var eventPair = eventPairs.shift();
    var a = eventPair[0];
    var b = eventPair[1];

    var eventA = events[a];
    var eventB = events[b];

    var c = letters.shift();

    $('.capsA').html(caps(eventA));
    $('.capsB').html(caps(eventB));
    $('.capsA').html(caps(eventA));
    $('.b').html(eventB);
    $(".err").hide();

    $(".continue").click(function() {
      var explanation = $('#explanation').val();
      if (explanation.length < 1) {
        $(".err").show();
      } else {
        $(".continue").unbind("click");
        $(".err").hide();
        experiment.data[qNumber] = [eventA, eventB, explanation];
        events[c] = explanation;
        eventPairs.push(a + c);
        eventPairs.push(b + c);
        $('#explanation').val("");
        if (qNumber + 1 < nQs) {
          experiment.trial(qNumber+1);
        } else {
          experiment.questionaire();
        }
      }
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
        showSlide("finished");
        setTimeout(function() { turk.submit(experiment.data) }, 1000);
      }
    });
  }
}
  
