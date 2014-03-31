//-------modifiable experiment variables-------
var experiment = {
  maxDepth: 5,
  seeds: shuffle(["John went to the store"
    , "Jane went to the post office"
    , "Alex did the dishes"
    , "Tom cooked dinner"
    , "Maya drove to work"
    , "Amy ate a sandwich"
    , "Jack read a book about gardening"
    , "Meg bought a new computer"
    , "Sam repaired his bicycle"
  ]),
  nQs: 25,
  startTime: Date.now(),
  qNum: 0,
  data: {dialogues:[]},

  skipsAllowed: function() {
    var possibleQsLeft = experiment.maxDepth*experiment.seeds.length;
    return possibleQsLeft + experiment.qNum > experiment.nQs;
    /*return true;*/
  },

  trial: function(dialogue) {
    $('.bar').css('width', ( (experiment.qNum / experiment.nQs)*100 + "%"));
    //if (state.queue.length > 0 && qNum + 1 < nQs) {
    var dialogue = dialogue == null ? null : dialogue;
    if (experiment.qNum + 1 < experiment.nQs) {
      if (dialogue == null || dialogue.stop) {
        if (dialogue) {
          //store dialogue
          experiment.data.dialogues.push(dialogue.knowledge);
        }
        var seed = experiment.seeds.shift();
        var facts = [new Fact(seed)];
        var graph = new Graph(facts);
        dialogue = new DialogueState(graph);
      }
      var query = dialogue.next_query();
      dialogue.knowledge.push({text: query.fact.title});
      var otherIds = [];
      for (var i=1; i<dialogue.knowledge.length; i++) {
        otherIds.push("ungrammatical" + i)
      }
      query.ask("trial", dialogue.accumulatedText(), otherIds, function(answer, otherAnswers) {
        dialogue.update(query, answer, otherAnswers);
        experiment.qNum ++;
        experiment.trial(dialogue);
      });
      query.is_started = true;
    } else {
      experiment.data.dialogues.push(dialogue.knowledge);
      experiment.questionaire();
    }
  },

  instructions: function() {
    if (turk.previewMode) {
      $("#instructions #mustaccept").show();
    } else {
      showSlide("instructions");
      $("#begin").click(function() {
        $("#begin").unbind("click");
        $('.bar').css('width', "0%");
        //ask first question
        //get first answer
        showSlide("trial");
        /*var seed = experiment.seeds.shift();
        var facts = [new Fact(seed)];
        var graph = new Graph(facts);
        state = new DialogueState(graph, 5);
        trial(state);*/
        experiment.trial();
      });
    }
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
        //data["graph"] = state.graph;
        var endTime = Date.now();
        experiment.data["duration"] = endTime - startTime;
        showSlide("finished");
        setTimeout(function() { turk.submit(experiment.data) }, 1000);
      }
    });
  }
}
//----------------------------------------------

//-----useful general purpose functions---------
function caps(a) {return a.substring(0,1).toUpperCase() + a.substring(1,a.length);}
function showSlide(id) { $(".slide").hide(); $("#"+id).show(); }
function shuffle(v) { newarray = v.slice(0);for(var j, x, i = newarray.length; i; j = parseInt(Math.random() * i), x = newarray[--i], newarray[i] = newarray[j], newarray[j] = x);return newarray;} // non-destructive.
function sample(v) {return(shuffle(v)[0]);}
function rm(v, item) {if (v.indexOf(item) > -1) { v.splice(v.indexOf(item), 1); }}
function rm_sample(v) {var item = sample(v); rm(v, item); return item;}
//----------------------------------------------

//------useful html stuff----------
var br = "<br/>";
var submit = "<button type='button' id='continue'>Continue</button>";
function radio(name, value) {return '<input type="radio" name="' + name + '" id="' + value + '" value="' + value + '"></input>';}
function span(id, content) {return '<span id="' + id + '">' + content + '</span>';}
function inputField(id) {return '<input type="text" size="45", id="' + id + '"></input>';}
function div(id, classStr, content) {
  var content = content == null ? "" : content;
  var classStr = classStr == null ? "" : "class='" + classStr + "'";
  return '<div id="' + id + '"' + classStr + '>' + content + '</div>';}
function p(str) {return "<p>" + str + "</p>";}
function checkbox(id) {return "<input type='checkbox' id='" + id + "'>";};

function checkboxAndTextInputTrial(question, errors) {
  return function(divId, accumulatedText, otherIds, callback) {
    //write stuff to html, like question, errors (initially hidden), etc.
    $("#" + divId).html(printlines(accumulatedText) + br + p(question.text) +
       submit + errors.map(function(e) {
        return div(e.id, "err", printlines(e.msg));
      }).join(""));

    //hide stuff in html
    $(".err").hide();

    //write the callback for continue function
    $("#continue").unbind("click");
    $("#continue").click(function() {
      //get answer
      var answer = $("#" + question.inputId).val();

      var otherAnswers = [];
      for (var i=0; i<otherIds.length; i++) {
        var otherId = otherIds[i];
        var isChecked = $("#" + otherId).is(":checked");
        if (isChecked) {
          otherAnswers.push(true);
        } else {
          otherAnswers.push(false);
        }
      }

      //check answer
      $(".err").hide(); //hide all errors by default
      //continue OR show any errors that are raised:
      var goToNextQuestion = true;
      for (var i=0; i<errors.length; i++) {
        var error = errors[i];
        var hasError = error.detector(answer);
        if (hasError && (error.showOnlyOnce == false || error.shown == false)) {
          $("#" + error.id).show();
          goToNextQuestion = false;
          error.shown = true;
        }
      }
      if (goToNextQuestion) {
        if (answer.length > 0) {
          callback(answer, otherAnswers);
        } else {
          callback("NO_RESPONSE", otherAnswers);
        }
      }
    });
  }
}

function simpleTextInputTrial(question, errors) {
  return function(divId, accumulatedText, callback) {
    //write stuff to html, like question, errors (initially hidden), etc.
    $("#" + divId).html(printlines(accumulatedText) + br + p(question.text) +
       submit + errors.map(function(e) {
        return div(e.id, "err", printlines(e.msg));
      }).join(""));

    //hide stuff in html
    $(".err").hide();

    //write the callback for continue function
    $("#continue").unbind("click");
    $("#continue").click(function() {
      //get answer
      var answer = $("#" + question.inputId).val();

      //check answer
      $(".err").hide(); //hide all errors by default
      //continue OR show any errors that are raised:
      var goToNextQuestion = true;
      for (var i=0; i<errors.length; i++) {
        var error = errors[i];
        var hasError = error.detector(answer);
        if (hasError && (error.showOnlyOnce == false || error.shown == false)) {
          $("#" + error.id).show();
          goToNextQuestion = false;
          error.shown = true;
        }
      }
      if (goToNextQuestion) {
        if (answer.length > 0) {
          callback(answer);
        } else {
          callback("NO_RESPONSE");
        }
      }
    });
  }
}

function printlines(lst) {
  return lst.map(function(str) {
    return str.length == 0 ? br : p(str);
  }).join("");
}
//-------------------------------------

//----------------------------graph stuff---------------------------------------
var ids = {
  counter: 0,
  next: function() {
    var c = ids.counter;
    ids.counter++;
    return c;
  }
}

Array.prototype.containsFact = function(fact) {
  var i = this.length;
  while (i--) {
    if (this[i].id === fact.id) return true;
  }
  return false;
}
Array.prototype.addFact = function(fact) {
  if (!this.containsFact(fact)) {
    this.push(fact);
  }
}

var Fact = function(title, value, is_actual, is_actionable) {
  this.id = ids.next();
  this.title = title;
  this.value = value == null ? null : value;
  this.is_actual = is_actual == null ? null : is_actual;
  this.is_actionable = is_actionable == null ? null : is_actionable;
}

var Graph = function(vertices, links) {
  this.vertices = vertices == null ? [] : vertices;
  this.links = links == null ? [] : links;
  this.parents = {};
  this.children = {};
  this.incoming_links = {};
  this.outgoing_links = {};
  this.add_vertex = function(vertex) {
    //if vertex is not already there
    this.vertices.addFact(vertex);
  }
  this.add_link = function(link) {
    this.add_vertex(link.source);
    this.add_vertex(link.target);
    this.parents[link.target.id] = link.source;
    this.children[link.source.id] = link.target;
    this.links.push(link);
    this.incoming_links[link.target.id] = link;
    this.outgoing_links[link.source.id] = link;
  }
}

var CausalLink = function(source, target, weight) {
  this.source = source;
  this.target = target;
  this.weight = weight;
}

function increases(source, target) {
  return new CausalLink(source, target, 1)
}

function decreases(source, target) {
  return new CausalLink(source, target, -1)
}
//------------------------------------------------------------------------------


var InputError = function(detector, msg, id, showOnlyOnce) {
  this.detector = detector;
  this.msg = msg;
  this.id = id;
  this.showOnlyOnce = showOnlyOnce;
  this.shown = false;
}

CauseQuery = function(graph, fact) {
  this.graph = graph;
  this.fact = fact;
  this.is_started = false;//is_started == null ? false : is_started;
  this.is_exhausted = false;//is_exhausted == null ? false : is_exhausted;
  this.errorShown = false;
  this.question = function() {
    var text;
    if (this.is_started) {
      text = "Why else is it that " + this.fact.title + "?" +
        " Because " + inputField("explanation") + "."
    } else {
      text = "Why is it that " + this.fact.title + "?" +
        " Because " + inputField("explanation") + "."
    }
    return {text: text, inputId:"explanation"};
  }
  this.errors = [
    //starts with 'of':
    new InputError(
      function(answer){return answer.slice(0,3) == "of ";},
      ["Sorry, we need you to answer in a way that doesn't start with 'of'. For example:"
        , ""
        , "Instead of saying 'I need a new phone because of my old one breaking.' you could say 'I need a new phone because my old one broke'."
        , "or"
        , "Instead of saying 'The universe exists the way it does because of the Big Bang', you could say 'The universe exists the way it does because the Big Bang happened.'"],
      "dontUseOf",
      false
    ),
    new InputError(
      function(answer) {return answer.length == 0 & experiment.skipsAllowed();},
      ["Please answer the question if you can."
        , "YOU MUST EXPLAIN " + experiment.nQs + " EVENTS TO COMPLETE THIS HIT."
        , ""
        , "If you can't think of an explanation for this event, that's OK, just click the continue button again. We will give you more events to explain until you find something you can answer.",
        , "Be careful! If you skip all the time, you will eventually run out of opportunities to skip questions."],
      "answerIfYouCan",
      true
    ),
    new InputError(
      function(answer) {return answer.length == 0 & (!experiment.skipsAllowed());},
      ["Please answer the question to the best of your ability."
        , "YOU MUST EXPLAIN " + experiment.nQs + " EVENTS TO COMPLETE THIS HIT."
        , ""
        , "There are no more opportunities to skip questions."],
      "answerNow",
      false
    )
  ];
  this.ask = checkboxAndTextInputTrial(this.question(), this.errors);
}

var DialogueState = function(graph, maxDepth) {
  this.graph = graph;
  this.depth = 0;
  this.maxDepth = maxDepth;
  this.queue = [];
  this.knowledge = [];
  this.stop = false;
  for (var i=0; i<this.graph.vertices.length; i++) {
    var vertex = this.graph.vertices[i];
    this.queue.push(new CauseQuery(graph, vertex));
  }
  this.add_vertex = function(fact) {
    this.graph.add_vertex(fact);
    //priority stuff:
    /*for (var i=0; i<this.graph.queries.length; i++) {
      var query = this.graph.queries[i];
      this.queue[query] = 5;
    }*/
  }
  this.add_link = function(fact) {
    this.graph.add_link(fact);
    /*for (var i=0; i<this.graph.queries.length; i++) {
      var query = this.graph.queries[i];
      this.queue[query] = 5;
    }*/
  }
  this.accumulatedText = function() {
    if (this.knowledge.length == 1) {
      return ["Here are some things you know:", "", caps(this.knowledge[0].text) + "."];
    } else {
      var lst = [
        "Here are some things you know:",
        "(if any of these sentences are ungrammatical or strangely worded, please mark the checkbox next to them)",
        "",
        caps(this.knowledge[0].text) + "."
      ];
      for (var i=1; i<this.knowledge.length; i++) {
        lst.push(caps(this.knowledge[i].text + "." + checkbox("ungrammatical" + i)));
      }
      return lst;
    }
     /*concat(
      this.knowledge.map(function(str) {return caps(str) + ".";})*/
  }
  this.update = function(query, answer, otherAnswers) {
    for (var i=0; i<otherAnswers.length; i++) {
      var otherAnswer = otherAnswers[i];
      this.knowledge[i+1].ungrammatical = otherAnswer;
    }
    if (answer != "NO_RESPONSE") {
      var source_fact = new Fact(answer, null, true);
      var link = increases(source_fact, query.fact);
      this.add_vertex(source_fact);
      this.add_link(link);
      this.queue.push(new CauseQuery(this.graph, source_fact));
      this.depth++;
      this.stop = (this.depth == this.maxDepth);
    } else {
      this.stop = true;
    }
  }
  this.next_query = function() {
    return this.queue.splice(this.queue.length-1, 1)[0];
    //possibly in future, make a priority queue and then this line would be getting elem at top of queue without removing it, but changing its priority
  }
}


//----------------------experiment functions------------------------------------



$(document).ready(function() {
  showSlide("consent");
  startTime = Date.now(); //for calculating duration of the expeirment later
  $("#mustaccept").hide();
});

