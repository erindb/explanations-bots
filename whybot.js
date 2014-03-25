function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}
function rm(v, item) {if (v.indexOf(item) > -1) { v.splice(v.indexOf(item), 1); }}
function rm_sample(v) {var item = sample(v); rm(v, item); return item;}

var startTime; //for calculating duration of the expeirment later
var nQs = 10; //can be changed for shorter or longer versions

$(document).ready(function() {
  showSlide("consent");
  startTime = Date.now(); //for calculating duration of the expeirment later
  $("#mustaccept").hide();
});

// whenever Ss need a new generating pair, we sample one from here
var generatingPairs = [
  ["Beth is very tired", "Beth is going to stay up until 3am"],
  ["Alex hates computers", "Alex just bought a computer"],
  ["Carol is American", "Carol lives in Uraguay"],
  ["David likes to listen to Ke$ha", "David doesn't want to buy a Ke$ha CD"]
].map(function(pair) {
  return pair.map(function(event) {
    return {text:event, causes:[]};
  });
});

var sentences = rm_sample(generatingPairs);
var unexplained = sentences.slice();
var explainMore = [];

function getNextExptType() {
  if (unexplained.length > 0 &&
      explainMore.length > 0) {
    var p = 0.5; //probability of asking about an unexplained sentence
    return (p > Math.random()) ? "explain" : "explainMore";
  } else if (unexplained.length > 0) {
    return "explain";
  } else if (explainMore.length > 0) {
    return "explainMore";
  } else {
    return "regenerate";
  }
};

function listCauses(lst) {
  if (lst.length == 1) {
    return lst[0];
  } else if (lst.length == 2) {
    return lst[0] + " and " + lst[1];
  } else {
    var beginning = lst.slice(0,lst.length-1);
    return beginning.join(", ") + ", and " + lst[lst.length-1];
  }
}

function listKnowledge() {
  var retstr = "<br/>";
  for (var i=0; i<sentences.length; i++) {
    var sentence = sentences[i];
    retstr += "<p>" + caps(sentence.text) + "</p>"
  }
  retstr += "<br/>";
  return retstr;
}

function graphKnowledge() {
  //draw a graph
}

function displayKnowledge() {
  return listKnowledge();
  //return graphKnowledge();
}

function inputField(id) {
  return '<input type="text" size="45", id="' + id + '"></input>';
}

function radio(id) {
  return '<input type="radio" name="myradios" id="' + id + '" value="' + id +
    '"></input>';
}

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
    var trialStart = Date.now();
    $("#errors").hide();
    var trialData = {};

    var type = getNextExptType();
    var knowledge;
    var trialInstructions;
    var getInput;
    var errors;
    var X;
    switch(type) {
      case "explain":
        knowledge = "<p>Here are some things you know:</p>" + displayKnowledge();
        X = rm_sample(unexplained);
        explainMore.push(X);
        trialInstructions = "<p>Please explain why " + X.text + ".</p>"
        getInput = "<p>" + caps(X.text) + " because " +
          inputField("explanation") + ".</p>"
        errors = "<p>Please give an explanation.</p>";
        break;
      case "explainMore":
        knowledge = "<p>Here are some things you know:</p>" + displayKnowledge();
        X = sample(explainMore);
        trialInstructions = "<p>" + caps(X.text) + " because " +
          listCauses(X.causes) + ".</p>" +
          "<p>Can you think of another explanation for why " + X.text + "?</p>"
        getInput = "<table align='center'><tbody><tr><td>" + radio("yes") + "</td><td>Yes<span id='yesExpand'>: " + caps(X.text) + " because " +
          inputField("explanation") + ".</span></td></tr><tr><td>" + radio("No") + "</td><td>No.</td></tr></tbody></table>"
        errors = "<p>Please give an explanation.</p>";
        break;
      case "regenerate":
        sentences = [rm_sample(generatingPairs)];
        unexplained = sentences.slice(0);
        knowledge = "<p>Here's a new set of things you know':</p>" +
          displayKnowledge();
        X = rm_sample(unexplained);
        trialInstructions = "<p>Please explain why " + X.text + ".</p>"
        getInput = "<p>" + caps(X.text) + " because " +
          inputField("explanation") + ".</p>"
        errors = "<p>Please give an explanation.</p>";
        break;
      default:
        console.log("error 0: that's not a valid trial type. you gave me: " + type)
    };

    showSlide("trial");

    $("#knowledge").html(knowledge);
    $("#trialInstructions").html(trialInstructions);
    $("#getInput").html(getInput);
    $("#errors").html(errors);

    if (type == "explainMore") {
      $("#yes").click(console.log("yes"));
      $("#no").click(console.log("no"));
    }

    $(".continue").click(function() {
      var trialEnd = Date.now();
      var rt = trialEnd - trialStart;
      var explanation = $("#explanation").val();
      if (explanation.length > 0) {
        $(".continue").unbind("click");
        $(".errors").hide();
        trialData["explanation"] = explanation;
        trialData["explainEvent"] = X.text;

        sentences.push({text:explanation, causes:[]});
        unexplained.push({text:explanation, causes:[]});
        X.causes.push(explanation);

        experiment.data["trial" + qNumber] = trialData;
        if (qNumber + 1 < nQs) {
          experiment.trial(qNumber+1);
        } else {
          experiment.questionaire();
        }
      } else {
        $("#errors").show();
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
        experiment.data["ungrammatical"] = ungrammatical;
        var endTime = Date.now();
        experiment.data["duration"] = endTime - startTime;
        showSlide("finished");
        setTimeout(function() { turk.submit(experiment.data) }, 1000);
      }
    });
  }
}
  
/*//parsing
function split_by_and(root_node) {
  function check_node_for_cc(node) {
    if (node.children) {
      if (node.children[0].children) {
        if (node.children[0].value == "S") {
          var next_node = node.children[0];
          var possible_cc = next_node.children;
          for (var k=0; k<possible_cc.length; k++) {
            var cc_node = possible_cc[k];
            if (cc_node.value == "CC") {
              return [i, k];
            }
          }
        } else {
          var possible_s = node.children[0].children;
          for (var i=0; i<possible_s.length; i++) {
            var next_node = possible_s[i];
            if (next_node.value == "S") {
              var possible_cc = next_node.children;
              for (var k=0; k<possible_cc.length; k++) {
                var cc_node = possible_cc[k];
                if (cc_node.value == "CC") {
                  return [i, k];
                }
              }
            }
          }
        }
      }
    }
    return false;
  }
  function get_words_from_node(node) {
    var children = node.children;
    if (children.length == 0) {
      return node.value;
    } else {
      var strings = [];
      for (var i=0; i<children.length; i++) {
        strings.push(get_words_from_node(children[i]));
      }
      return(strings.join(" "));
    }
  }

  function get_words_from_node_list(node_list) {
    var strings = [];
    for (var i=0; i<node_list.length; i++) {
      strings.push(get_words_from_node(node_list[i]));
    }
    return(strings.join(" "));
  }

  var cc_indices = check_node_for_cc(root_node);
  if (cc_indices) {
    var s_ind = cc_indices[0];
    var cc_ind = cc_indices[1];
    var nodes_a = root_node.children[0].children.splice(0);
    var nodes_b = nodes_a.splice(s_ind+1,nodes_a.length);
    var nodes_to_add_to_b = nodes_a[s_ind].children.splice(cc_ind,nodes_a[s_ind].children.length);
    for (i=1; i<nodes_to_add_to_b.length; i++) {
      nodes_b.splice(0,0,nodes_to_add_to_b[i]);
    }
    var a = get_words_from_node_list(nodes_a);
    var b = get_words_from_node_list(nodes_b);
    return [a,b];
  }
  else {
    return [get_words_from_node(root_node)];
  }
}
*/