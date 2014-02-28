function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}
function rm(v, item) {v.splice(v.indexOf(item), 1);}
function rm_sample(v) {var item = sample(v); rm(v, item); return item;}
var startTime;

var nQs = 6;

$(document).ready(function() {
  showSlide("consent");
  startTime = Date.now();
  $("#mustaccept").hide();
  /*$.post("http://www.stanford.edu/~erindb/cgi-bin/get-mturk-results.php");*/
});

var ungrammatical = [];


var want = {};
var explained = {};

var uncategorized_activities = [];
var unexplained_activities = [];

var unexplained_want = [];

var causalPairs = [];

var experiment = {
  data: {},
  
  instructions: function() {
    if (turk.previewMode) {
      $("#instructions #mustaccept").show();
    } else {
      showSlide("instructions");
      $("#begin").click(function() { experiment.initialize(0); })
    }
  },

  initialize: function(qNumber) {
    $(".err").hide();
    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));
    showSlide("initialize");
    $(".continue").click(function() {
      var activity = $("#activity").val();
      if (activity.length > 0) {
        $(".continue").unbind("click");
        uncategorized_activities.push(activity);
        $("#activity").val("");
        experiment.why(qNumber+1);
      } else {
        $(".err").show();
      }
    })
  },

  why: function(qNumber) {
    $(".err").hide();
    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));
    var activity = rm_sample(unexplained_activities);
    $(".repeat-activity").html(activity);
    showSlide("why");
    $(".continue").click(function() {
      var explanation = $("#explanation").val();
      if (explanation.length > 0) {
        $(".continue").unbind("click");
        uncategorized_activities.push(explanation);
        unexplained_activities.push(explanation);
        causalPairs.push({cause:explanation, effect:activity});
        $("#explanation").val("");
        experiment.do_you_want(qNumber+1);
      }
    })
  },

  do_you_want: function(qNumber) {
    var activity = rm_sample(uncategorized_activities);
    showSlide("do-you-want");
    $(".repeat-activity").html(activity);
    var clickfunction = function(want_value) {
      return function() {
        $("#yes").unbind("click");
        $("#no").unbind("click");
        $(".ungrammatical").unbind("click");
        want[activity] = want_value;
        if (uncategorized_activities.length > 0) {
          experiment.do_you_want(qNumber+1);
        } else {
          //check for conflict
          experiment.check_for_conflict(qNumber+1);
        }
      }
    }
    $("#yes").click(clickfunction(true));
    $("#no").click(clickfunction(false))
    $(".ungrammatical").click(clickfunction(null));
  },

  check_for_conflict: function(qNumber) {
    var causalPair = causalPairs[0];
    if (causalPair.cause && causalPair.effect) {
      //want both (ask some more)
      unexplained_want.push(causalPair.cause);
      unexplained_want.push(causalPair.effect);
      experiment.why_do_you_want(qNumber);
    } else if (causalPair.cause != causalPair.effect) {
      //conflict (try to fix)
      experiment.conflict(qNumber);
    } else {
      //want neither (dig deeper)
      experiment.why(qNumber);
    }
  },

  why_do_you_want: function(qNumber) {
    var activity = rm_sample(unexplained_want);
    showSlide("why-do-you-want");
    $(".continue").click(function() {
      $(".continue").unbind("click");
      if (unexplained_want.length > 0) {
        experiment.why_do_you_want(qNumber+1);
      } else {
        experiment.questionaire();
      }
    })
  },

  conflict: function(qNumber) {
    showSlide("conflict");
    $(".continue").click(function() {
      $(".continue").unbind("click");
      experiment.questionaire();
      //experiment.trial(qNumber+1);
    })
  },

  other_ways: function(qNumber) {
    showSlide("other-ways");
    $(".continue").click(function() {
      $(".continue").unbind("click");
      experiment.questionaire();
      //experiment.trial(qNumber+1);
    })
  },
  
/*  trial: function(qNumber, causalPair) {
    $(".err").hide();
    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));
    if (qNumber == 0) {
      experiment.initialize(qNumber);
    } else if (qNumber == 1) {
      experiment.why(qNumber);
    } else if (qNumber == 2 || qNumber == 3) {
      experiment.do_you_want(qNumber);
    } else if (causalPair != null && causalPair.length > 0) {
      experiment.why_do_you_want(causalPair);
    } else if (causalPairs.length > 0) {
      var causalPair = rm_sample(causalPairs);
      if (want[causalPair.effect] != want[causalPair.cause]) {
        experiment.conflict(qNumber, causalPair);
      } else {
        experiment.why_do_you_want(qNumber, causalPair);
      }
    } else {
      experiment.questionaire();
    }
  },*/
  
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
