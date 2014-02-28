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
      eventParagraphs += '<p class="things-you-know">' + caps(e) + "." + checkbox + "</p>";
    }
    $("#events").html(eventParagraphs);

    if (unexplained.length == 0) {
      unexplained = generatingPair.slice(0);
    }

    explainEvent = sample(unexplained);
    unexplained.splice(unexplained.indexOf(explainEvent), 1);
    $("#explainEvent").html(caps(explainEvent));
    $("#lowercaseExplainEvent").html(explainEvent);

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
          //unexplained.push(explanation);
          nlp.getParsedTree(explanation, function(data) {
            new_events = split_by_and(data);
            for (var i=0; i<new_events.length; i++) {
              unexplained.push(new_events[i]);
            }
          });
        }
        setTimeout( function() {
          $('input:radio[name=help]:checked').val("");
          $('#explanation').val("");
          $('#otherText').val("");
          $('input:radio[name=help]').attr('checked',false);
          if (qNumber + 1 < nQs) {
            experiment.trial(qNumber+1);
          } else {
            experiment.questionaire();
          }
        }, 200);
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
  
//parsing
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
