function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}

function secondPerson(str) {
  var replacements = [
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

var nQs = 10;

$(document).ready(function() {
  showSlide("consent");
  $("#mustaccept").hide();
});

var goals = [];
var subgoals = [];
var goalCounts = {};
var goalParent = {};

var goalPairs = [];

//why are you doing x? what other things are you doing (or could you be doing) to achieve y?

var experiment = {
  data: {},
  
  instructions: function() {
    if (turk.previewMode) {
      $("#instructions #mustaccept").show();
    } else {
      showSlide("instructions");
      $("#begin").click(function() { experiment.goalTrial(); })
    }
  },

  goalTrial: function(qNumber) {
    showSlide("goalTrial");
    if (qNumber == null) {
      $("#a").html("a");
    } else {
      $("#a").html("another");
    }
    $('.continue').click(function() {
      goal = $('#mygoal').val();
      if (goal.length < 1) {
        $('.err').show()
      } else {
        goals.push(goal);
        goalCounts[goal] = 0;
        $('#mygoal').val("");
        if (qNumber == null) {
          experiment.trial(0);
        } else {
          experiment.trial(qNumber);
        }
      }
    })
  },

  trial: function(qNumber) {
    var type;
    if (qNumber == 0 & subgoals.length > 0) {
      type = "subgoal";
    } else if (subgoals.length > 0 & goals.length > 0) {
      type = sample(["subgoal", "explanation"]);
    } else if (goals.length > 0) {
      type = "subgoal";
    } else {
      type = "goal";
    }
    if (type == "subgoal") {
      experiment.subgoalTrial(qNumber);
    } else if (type == "explanation") {
      experiment.explanationTrial(qNumber);
    } else {
      experiment.goalTrial(qNumber);
    }
  },
  
  subgoalTrial: function(qNumber) {
    var type = "subgoal";
    $(".err").hide();

    showSlide("subgoalTrial");

    var goal = sample(goals);

    if (goal == goals[0]) {
      $("#directly").hide();
    } else {
      $("#directly").show();
    }
    if (goalCounts[goal] == 0) {
      $("#nomore").hide();
    } else {
      $("#nomore").show();
    }

    if (goalCounts[goal] == 0) {
      $(".quantifier").html("one");
    } else if (goalCounts[goal] > 0) {
      $(".quantifier").html("another");
    }

    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));

    $('.goal2').html(secondPerson(goal));
    $('.goal').html(goal);

    $(".continue").click(function() {
      var response = $('#subgoalResponse').val();
      if (response.length < 1) {
        //also check if this response has already been given
        $(".err").show();
        if (goal == goals[0]) {
          $("#orclick").hide();
        } else {
          $("#orclick").show();
        }
      } else {
        $("#nomore").unbind("click");
        $("#directly").unbind("click");
        $(".continue").unbind("click");
        $(".err").hide();
        experiment.data[qNumber] = {
          type:type,
          goal:goal,
          response:response
        };
        subgoals.push(response);
        goalParent[response] = goal;
        goalCounts[goal] += 1;
        if (!$("#completed").is(':checked')) {
          goals.push(response);
          goalCounts[response] = 0;
        }
        $('#subgoalResponse').val("");
        if (qNumber + 1 < nQs) {
          experiment.trial(qNumber+1);
        } else {
          experiment.questionaire();
        }
      }
    });

    $("#directly").click(function() {
      $("#nomore").unbind("click");
      $("#directly").unbind("click");
      $(".continue").unbind("click");
      experiment.data[qNumber] = {
        type:type,
        goal:goal,
        response:"DIRECTLY"
      };
      //take that goal off the list
      goals.splice(goals.indexOf(goal), 1);
      if (qNumber + 1 < nQs) {
        experiment.trial(qNumber+1);
      } else {
        experiment.questionaire();
      }
    });

    $("#nomore").click(function() {
      $("#nomore").unbind("click");
      $("#directly").unbind("click");
      $(".continue").unbind("click");
      experiment.data[qNumber] = {
        type:type,
        goal:goal,
        response:"NOMORE"
      };
      //take that goal off the list
      goals.splice(goals.indexOf(goal), 1);
      if (qNumber + 1 < nQs) {
        experiment.trial(qNumber+1);
      } else {
        experiment.questionaire();
      }
    });
  },
  
  explanationTrial: function(qNumber) {
    var type = "explanation";
    $(".err").hide();

    showSlide("explanationTrial");

    var subgoal = sample(subgoals);
    subgoals.splice(subgoals.indexOf(subgoal), 1)

    var goal = goalParent[subgoal];

    $('.goal2').html(secondPerson(goal));
    $('.subgoal2').html(secondPerson(subgoal));

    $('.goal').html(goal);
    $('.subgoal').html(subgoal);

    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));

    $(".continue").click(function() {
      var response = $('#explanationResponse').val();
      if (response.length < 1) {
        //also check if this response has already been given
        $(".err").show();
      } else {
        $(".continue").unbind("click");
        $(".err").hide();
        experiment.data[qNumber] = {
          type:type,
          goal:goal,
          subgoal:subgoal,
          response:response
        };
        goalParent[subgoal] = goal;
        goalPairs.push(goal + subgoal);
        $('#explanationResponse').val("");
        if (qNumber + 1 < nQs) {
          experiment.trial(qNumber+1);
        } else {
          experiment.questionaire();
        }
      }
    });
    $("#obvious").click(function() {
      $("#obvious").unbind("click");
      experiment.data[qNumber] = {
        type:type,
        goal:goal,
        subgoal:subgoal,
        response:"OBVIOUS"
      }
        if (qNumber + 1 < nQs) {
          experiment.trial(qNumber+1);
        } else {
          experiment.questionaire();
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
        showSlide("finished");
        setTimeout(function() { turk.submit(experiment.data) }, 1000);
      }
    });
  }
}
  