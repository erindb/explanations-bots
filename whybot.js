function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function uniform(a, b) { return ( (Math.random()*(b-a))+a ); }
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}
function rm(v, item) {if (v.indexOf(item) > -1) { v.splice(v.indexOf(item), 1); }}
function rm_sample(v) {var item = sample(v); rm(v, item); return item;}

var startTime; //for calculating duration of the expeirment later
//var experimentLength = 60000;//600000; //ten minute experiment
var nQs = 25;
var data = {};

//---------------html stuff-------------
var br = "<br/>";
var submit = "<button type='button' class='continue'>Submit</button>";
function radio(name, value) {
  return '<input type="radio" name="' + name + '" id="' + value + '" value="' +
    value + '"></input>';}
function span(id, content) {
  return '<span id="' + id + '">' + content + '</span>';}
function inputField(id) {
  return '<input type="text" size="45", id="' + id + '"></input>';}
function div(id) {
  return '<div id="' + id + '"></div>';}

radioTable = function(id, params) {
  function changeCreator(i, params) {
    var value = params[i][0];
    return function() {
      var thisRadio = $("#" + value);
      var s = $("#" + thisRadio.val() + "-selected");
      var d = $("#" + thisRadio.val() + "-default");
      if (thisRadio.is(":checked")) {
        //show selected, hide default
        s.show();
        d.hide();
      } else {
        //hide selected, show default
        s.hide();
        d.show();
      }  }
  }
  //write html
  var width = 600;
  var htmlString = "<table align='center'><tbody>";
  for (var i=0; i<params.length; i++) {
    var param = params[i];
    var value = param[0];
    var defaultText = param[1];
    var selectedText = param[2];
    //table row with radio button in first col and variable text in second col
    htmlString += "<tr><td>" + radio("radioTable", value) +
      "</td><td width='" + width + "'>" +
      span(value + "-selected", selectedText) +
      span(value + "-default", defaultText) + "</td></tr>";
  }
  htmlString += "</tbody></table>";
  $("#" + id).html(htmlString);

  //dynamify html
  for (var i=0; i<params.length; i++) {
    var param = params[i];
    var value = param[0];
    $("#" + value + "-selected").hide();
    $("#" + value + "-default").show();
    $("input[name='radioTable']").change(changeCreator(i, params))
  }
}
//---------------------------------------------

//event constructor
var Fact = function(text, graph, causes) {
  this.explained = false;
  this.explainable = true;//explainable == null ? true : explainable;
  this.text = text;
  this.caps = caps(this.text);
  this.causes = causes == null ? [] : causes;
  this.collected = false;
  this.exhausted = false;
  this.graph = graph;

  this.question = function(id) {
    var questionString;
    if (this.explained) {
      questionString = "X because Y, Z, and W. Can you think of another explanation for why " + this.text + "?";
    } else if (this.explainable) {
      questionString = "Please give an explanation for why " + this.text + ".";
    } else {
      questionString = "Can you give an explanation for why " + this.text + "?";
    }
    $("#" + id).html(questionString);
  }
  this.answer = function(id) {
    var inputSection = this.caps + " because " + inputField("explanation") + ".";
    if (this.explained || this.explainable == false) {
      radioTable(id, [
        ["yes", "Yes:", "Yes: " + inputSection],
        ["no", "No.", "No."]])
    } else {
      $("#" + id).html(br + inputSection);
    }
  }
  this.explain = function() {
    showSlide("trial");
    $("#trial").html(div("question") + div("answer") + submit);
    this.question("question");
    this.answer("answer");
  }
  this.collect = function(qNum) {
    var trialData = {
      "seed":this.graph.seed.text,
      "event":this.text
    };
    function isNoSelected() {
      var possibleRadio = $("input:radio[name=radioTable]:checked");
      if (possibleRadio) {
        return possibleRadio.val() == "no";
      } else {
        return false;
      }
    }
    if (isNoSelected()) {
      //maybe radio button "no" is selected
      this.collected = true;
      data["trial" + qNum] = trialData;
      trialData["explanation"] = "NONE";
      this.exhausted = true;
    } else {
      //else maybe there's input
      var explanation = $("#explanation").val();
      if (explanation.length > 0) {
        this.collected = true;
        this.graph.queue.push(new Fact(explanation, this.graph, this.text));
        trialData["explanation"] = explanation;
      } else {
        //else show an error
      }
    }
  }
}

var Graph = function(seedText) {
  //make graph
  this.seed = new Fact(seedText, this);
  this.queue = [this.seed];
  this.next = function() {
    return rm_sample(this.queue);
  }
}

function instructions() {
  if (turk.previewMode) {
    $("#instructions #mustaccept").show();
  } else {
    showSlide("instructions");
    $("#begin").click(function() { whybot(new Graph("John went to the store")); })
  }
}

function whybot(graph, qNum) {
  //if (Date.now() - startTime < experimentLength) {
  if (qNum < nQs) {
    var fact = graph.next();
    fact.explain();
    $(".continue").click(function() {
      fact.collect();
      if (fact.collected) {
        //(".continue").unbind("click");
        var nextGraph = graph.queue.length > 0 ?
          graph :
          new Graph("the chicken crossed the road");
        whybot(nextGraph, qNum + 1);
      }
    });
  } else {
    questionaire();
  }
}

$(document).ready(function() {
  showSlide("consent");
  startTime = Date.now(); //for calculating duration of the expeirment later
  $("#mustaccept").hide();
});

function questionaire() {
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
      data["language"] = lang;
      data["comments"] = comments;
      data["age"] = age;
      data["events"] = events;
      data["ungrammatical"] = ungrammatical;
      var endTime = Date.now();
      data["duration"] = endTime - startTime;
      showSlide("finished");
      setTimeout(function() { turk.submit(data) }, 1000);
    }
  });
}


/*//var nQs = 10; //can be changed for shorter or longer versions



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





var experiment = {
  data: {},

  
  
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

        data["trial" + qNumber] = trialData;
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
        data["language"] = lang;
        data["comments"] = comments;
        data["age"] = age;
        data["events"] = events;
        data["ungrammatical"] = ungrammatical;
        var endTime = Date.now();
        data["duration"] = endTime - startTime;
        showSlide("finished");
        setTimeout(function() { turk.submit(data) }, 1000);
      }
    });
  }
}*/
  
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