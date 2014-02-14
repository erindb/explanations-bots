function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}

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

  goalTrial: function() {
    showSlide("goalTrial");
    $('.continue').click(function() {
      goal = $('#mygoal').val();
      if (goal.length < 1) {
        $('.err').show()
      } else {
        goals.push(goal);
        goalCounts[goal] = 0;
        $('#mygoal').val("");
        experiment.trial(0);
      }
    })
  },

  trial: function(qNumber) {
    var type;
    if (qNumber == 0) {
      type = "subgoal";
    } else {
      type = sample(["subgoal", "explanation"]);
    }
    if (type == "subgoal") {
      experiment.subgoalTrial(qNumber);
    } else {
      experiment.explanationTrial(qNumber);
    }
  },
  
  explanationTrial: function(qNumber) {
    var type = "explanation";
    $(".err").hide();

    showSlide("explanationTrial");
    subgoals = shuffle(subgoals);
    var subgoal = subgoals.shift();
    if (subgoal == null) {
      experiment.subgoalTrial(qNumber);
    } else {
      var goal = goalParent[subgoal]

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
      })
    }
  },
  
  subgoalTrial: function(qNumber) {
    var type = "subgoal";
    $(".err").hide();

    showSlide("subgoalTrial");
    var goal = sample(goals);

    if (goalCounts[goal] == 0) {
      $(".quantifier").html("one");
    } else {
      $(".quantifier").html("another");
    }

    $('.bar').css('width', ( (qNumber / nQs)*100 + "%"));

    $('.goal').html(goal);

    $(".continue").click(function() {
      var response = $('#subgoalResponse').val();
      if (response.length < 1) {
        //also check if this response has already been given
        $(".err").show();
      } else {
        $(".continue").unbind("click");
        $(".err").hide();
        experiment.data[qNumber] = {
          type:type,
          goal:goal,
          response:response
        };
        goals.push(response);
        subgoals.push(response);
        goalCounts[response] = 0;
        goalCounts[goal] += 1;
        goalParent[response] = goal;
        $('#subgoalResponse').val("");
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
        showSlide("finished");
        setTimeout(function() { turk.submit(experiment.data) }, 1000);
      }
    });
  }
}
  
