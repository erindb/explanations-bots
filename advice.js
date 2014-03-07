function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}
function rm(v, item) {if (v.indexOf(item) > -1) { v.splice(v.indexOf(item), 1); }}
function rm_sample(v) {var item = sample(v); rm(v, item); return item;}
var startTime;

function to_frame(str) {
  var replacements = [
    ["^am", "be"],
    ["^was", "have been"],
    ["I was", "you were"],
    ["I", "you"],
    ["me", "you"],
    ["my", "your"],
    ["myself", "yourself"],
    ["mine", "yours"],
    ["am", "are"]
  ]
  for (var i=0; i<replacements.length; i++) {
    var pair = replacements[i];
    var regexpStr = '(^| )' + pair[0] + '($| )';
    var regexp = new RegExp(regexpStr, 'g');
    str = str.replace(regexp, "$1" + pair[1] + "$2");
  }
  return str;
}

function why_frame(str) {
  var replacements = [
    ["^am", "are you"],
    ["^was", "were you"],
    ["I was", "you were"],
    ["I", "you"],
    ["me", "you"],
    ["my", "your"],
    ["myself", "yourself"],
    ["mine", "yours"],
    ["am", "are"]
  ]
  for (var i=0; i<replacements.length; i++) {
    var pair = replacements[i];
    var regexpStr = '(^| )' + pair[0] + '($| )';
    var regexp = new RegExp(regexpStr, 'g');
    str = str.replace(regexp, "$1" + pair[1] + "$2");
  }
  if (str.substring(0, 7) === "are you") {
    return str;
  } else {
    return "do you " + str;
  }
}

var nQs = 10;

$(document).ready(function() {
  showSlide("consent");
  startTime = Date.now();
  $("#mustaccept").hide();
  /*$.post("http://www.stanford.edu/~erindb/cgi-bin/get-mturk-results.php");*/
});

var ungrammatical = [];


var want = {};
var causalPairs = [];

var uncategorized_activities = []; //ask if they want to
var unexplained_activities = []; //ask for a cause
var explain_more_activities = []; //ask for other causes

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
    var trialStart = Date.now();
    $(".err").hide();
    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));
    showSlide("initialize");
    $(".continue").click(function() {
      var activity = $("#A").val();
      if (activity.length > 0) {
        $(".continue").unbind("click");
        uncategorized_activities.push(activity);
        unexplained_activities.push(activity);
        $("#A").val("");
        var trialData = {rt: Date.now() - trialStart, activity:activity}
        experiment.data["trial" + qNumber] = trialData;
        experiment.trial(qNumber+1);
      } else {
        $(".err").show();
      }
    })
  },

  why: function(qNumber) {
    var trialStart = Date.now();
    $(".optional-text").hide();
    $("#nothing-else").hide();

    var type;
    if (unexplained_activities.length > 0 &&
        explain_more_activities.length > 0) {
      type = sample(["unexplained", "explain_more"]);
    } else if (unexplained_activities.length > 0) {
      type = "unexplained";
    } else {
      type = "explain_more";
    }
    var activity;
    switch (type) {
      case "unexplained":
        activity = rm_sample(unexplained_activities);
        break;
      case "explain_more":
        activity = sample(explain_more_activities);
        $("#else").show();
        $("#nothing-else").show();
        break;
    }

    $(".err").hide();
    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));
    $("#activity").html(activity);
    $("#why_frame").html(why_frame(activity));
    showSlide("why");
    $(".continue").click(function() {
      var explanation = $("#explanation").val();
      if (explanation.length > 0) {
        $(".continue").unbind("click");
        $(".ungrammatical").unbind("click");
        $("#nothing-else").unbind("click");
        uncategorized_activities.push(explanation);
        unexplained_activities.push(explanation);
        explain_more_activities.push(activity);
        causalPairs.push({cause:explanation, effect:activity});
        $("#explanation").val("");
        var trialData = {rt: Date.now() - trialStart, activity:activity, explanation: explanation}
        experiment.data["trial" + qNumber] = trialData;
        experiment.do_you_want(qNumber+1);
      } else {
        $(".err").show();
      }
    })
    $(".ungrammatical").click(function() {
      $(".ungrammatical").unbind("click");
      $(".continue").unbind("click");
        $("#nothing-else").unbind("click");
      rm(uncategorized_activities, activity);
      rm(explain_more_activities, activity);
      var trialData = {rt: Date.now() - trialStart, activity:activity, explanation: "UNGRAMMATICAL"}
      experiment.data["trial" + qNumber] = trialData;
      experiment.trial(qNumber+1);
    })
    $("#nothing-else").click(function() {
      $(".ungrammatical").unbind("click");
      $(".continue").unbind("click");
      $("#nothing-else").unbind("click");
      rm(explain_more_activities, activity);
      var trialData = {rt: Date.now() - trialStart, activity:activity, explanation: "NOTHING_ELSE"}
      experiment.data["trial" + qNumber] = trialData;
      experiment.trial(qNumber+1);
    })
  },

/*  switch(a) {
    case 1: "apple"; break;
    case 2: "orange"; break;
  }*/

  do_you_want: function(qNumber) {
    var trialStart = Date.now();
    var activity = rm_sample(uncategorized_activities);
    showSlide("do-you-want");
    $("#to_frame").html(to_frame(activity));
    var clickfunction = function(want_value) {
      return function() {
        $("#yes").unbind("click");
        $("#no").unbind("click");
        $(".ungrammatical").unbind("click");
        want[activity] = want_value;
        if (want_value == null) {
          rm(unexplained_activities, activity);
        }
        var trialData = {rt: Date.now() - trialStart, activity:activity, want:want_value}
        experiment.data["trial" + qNumber] = trialData;
        experiment.trial(qNumber+1);
      }
    }
    $("#yes").click(clickfunction(true));
    $("#no").click(clickfunction(false))
    $(".ungrammatical").click(clickfunction(null));
  },

  trial: function(qNumber) {
    if (qNumber < nQs) {
      if (uncategorized_activities.length > 0 &&
          (unexplained_activities.length > 0 || 
            explain_more_activities.length > 0)) {
        type = sample(["categorize", "explain"]);
        switch(type) {
          case "categorize":
            experiment.do_you_want(qNumber);
            break;
          case "explain":
            experiment.why(qNumber);
            break;
        }
      } else if (uncategorized_activities.length > 0) {
        experiment.do_you_want(qNumber);
      } else if (unexplained_activities.length > 0 ||
                 explain_more_activities.length > 0) {
        experiment.why(qNumber);
      } else {
        experiment.initialize(qNumber);
      }
    } else {
      experiment.questionaire();
    }
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
        experiment.data["want"] = want;
        experiment.data["causalPairs"] = causalPairs;
        experiment.data["ungrammatical"] = ungrammatical;
        var endTime = Date.now();
        experiment.data["duration"] = endTime - startTime;
        showSlide("finished");
        setTimeout(function() { turk.submit(experiment.data) }, 1000);
      }
    });
  }
}
