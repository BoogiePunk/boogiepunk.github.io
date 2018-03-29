var nextRoundTime = 2000;

$(document).ready(function(){
  // Settings Setup
  $("#settingsInputRoundTime input").attr("value", nextRoundTime);
  $("#settingsInputRoundTime input[type='range']").on("input", e => {
    $("#settingsInputRoundTime input[type='number']").val(e.target.value);
    $("#settingsInputRoundTime input[type='number']").css("border-color", "");
    nextRoundTime = e.target.value;
  });
  $("#settingsInputRoundTime input[type='number']").on("input", e => {
    if(e.target.value >= 0 && e.target.value <= 10000) {
      $("#settingsInputRoundTime input[type='number']").css("border-color", "");
      $("#settingsInputRoundTime input[type='range']").val(e.target.value);
      nextRoundTime = e.target.value;
    } else {
      $("#settingsInputRoundTime input[type='number']").css("border-color", "#ff0000");
    }
  });

  $("#settingsPopup .close").click(e => $("#settingsPopup").removeClass("active"));

  // About Setup
  if(sessionStorage["hideAbout"]) {
    $("#about").remove();
  } else {
    $("#about .close").click(e => $("#about").fadeOut(250, ee => {
      sessionStorage.setItem("hideAbout", true);
      $("#about").remove()
    }));
  }

  startup();
});

function startup() {
  $.get("./home.html", function(d){
    //Variables
    var anime = [];
    var directors = [];

    $("body").append(d);
    //Settings Setup
    $(".settingsTrigger").click(e => $(".overlay").addClass("active"));

    $("#loadingOverlay").fadeOut(250);


    //Get Anime by Popularity
    $("#popularInput button").click(function(){
      var amount = $("#popularInput input").val();
      if(amount && amount >= 10 && amount <=1000) {
        //Add loading loadingOverlay
        $("#loadingOverlay").fadeIn(250);
        //Get anime-list data
        var p = 0;
        var getData = () => $.post({
        	url: "https://graphql.anilist.co",
        	contentType: "application/json",
        	data: JSON.stringify({
        		query: "query ($page:Int) {Page(perPage:50,page:$page){mediaTrends(sort:POPULARITY_DESC){mediaId media {title {romaji}coverImage{large}staff(sort:SEARCH_MATCH){edges{role node{id name{first last}image{large}}}}}}}}",
        		variables: {"page": p}
        	}),
        	success: function(d) {
        		d.data.Page.mediaTrends.forEach(e => {
              //if(!e.media.staff.edges.some(ee => ee.role == "Director"))
              //  console.log(e);
        			if(!anime.some(ee => e.mediaId == ee.mediaId) && anime.length < amount && e.media.staff.edges.some(ee => ee.role == "Director"))
        				anime.push(e);
        		});
        		//console.log(p);
        		p++;
        		if(anime.length < amount) {
              $("#loadingOverlay .loaderText h3").text(anime.length + "/" + amount);
              getData();
            } else {
              $("#loadingOverlay .loaderText h3").text("");
              startGame();
            }
        	}
        });
        getData();
      } else {
        $("#popularInput input").css("border-color", "#ff0000");
      }
    });

    //Get Anime by User
    $("#usernameInput button").click(function(){
      var usr = $("#usernameInput input").val();
      if(usr !== "") {
        //Add loading loadingOverlay
        $("#loadingOverlay").fadeIn(250);
        //Get anime-list data
        $.post({
        	url: "https://graphql.anilist.co",
        	contentType: "application/json",
        	data: JSON.stringify({
        		query: "query($user:String){MediaListCollection(userName:$user,type:ANIME){lists{name entries{media{title{romaji}coverImage{large}staff(sort:SEARCH_MATCH){edges{role node{id name{first last}image{large}}}}}}}}}",
        		variables: {user: usr}
        	}),
        	success: function(d) {
            if(d.data.MediaListCollection.lists.length == 0) {
              $("#loadingOverlay").fadeOut(250);
              $("#usernameInput input").css("border-color", "#ff0000");
              //startup();
            } else {
              //Get anime-list
              anime = d.data.MediaListCollection.lists.find(e => e.name === "Completed").entries.filter(e => e.media.staff.edges.find(ee => ee.role === "Director"));
              startGame();
            }
          }
        });
      } else {
        $("#usernameInput input").css("border-color", "#ff0000");
      }
    });



    function prepareDirectorList() {
      //Get directors
      anime.forEach(function(e,i) {
        var dd = e.media.staff.edges.find(e => e.role === "Director");
        if(dd) {
          var found = false;
          for(var i=0; i<dd.length; i++){
            if(directors[i].id === dd.node.id) {
              found = true;
              break;
            }
          }
          if(!found)
            directors.push(dd.node);
        }
      });
    }

    function startGame() {
      console.log(anime);
      //Get Direcor List
      prepareDirectorList();

      var animeCount = anime.length;
      var rightCount=0, wrongCount=0;

      var roundCount;

      //Get Amount Of Rounds
      $("#usernameInput, #popularInput, #settingsButton").remove();
      $("#roundInput").fadeIn();

      $("#roundInput input").attr("max", animeCount).attr("value", animeCount);
      $("#roundInput input[type='range']").on("input", e => {
        $("#roundInput input[type='number']").val(e.target.value);
        $("#roundInput input[type='number']").css("border-color", "");
      });
      $("#roundInput input[type='number']").on("input", e => {
        if(e.target.value >= 10 && e.target.value <= animeCount) {
          $("#roundInput input[type='number']").css("border-color", "");
          $("#roundInput input[type='range']").val(e.target.value);
        } else {
          $("#roundInput input[type='number']").css("border-color", "#ff0000");
        }
      });
      $("#roundInput button").click(function(){
        if($("#roundInput input[type='number']").val() >= 10 && $("#roundInput input[type='number']").val() <= animeCount) {
          roundCount = parseInt($("#roundInput input[type='number']").val());
          getRoundScreen();
        }
      });

      $("#loadingOverlay").fadeOut(250);

      //Get screen
      function getRoundScreen(){
        $("#loadingOverlay").fadeIn(250, function(){
          $(".screen").remove();

          //If All Rounds Over
          if(animeCount - roundCount == anime.length) {
            $("#loadingOverlay").fadeOut(250, function() {
              $.get("./gameover.html", function(d) {
                $("body").append(d);
                $(".pieChart > div").css("background", (rightCount>=wrongCount ? "#0f0" : "#f00")).css("transform", "rotate("+(rightCount>=wrongCount ? (rightCount/(rightCount+wrongCount)) : (rightCount/(wrongCount+rightCount))+0.5)+"turn)");
                $(".gameoverSection h3").html("You got <span style='color:#0f0'>" + rightCount + " (" + (rightCount/roundCount*100).toFixed(2) + "%)</span> right<br>and <span style='color:#f00'>" + wrongCount + " (" + (wrongCount/roundCount*100).toFixed(2) +"%)</span> wrong<br>out of " + roundCount);
                $("#goHome").click(function() {
                  $("#loadingOverlay").fadeIn(250, function(){
                    $(".screen").remove();
                    startup();
                  });
                });
              });
            });
          //If Rounds Still Left
          } else {
            $.get("./round.html", function(d){
              $("body").append(d);
              var a = randomArrayElementAndDelete(anime).media;
              console.log(a);

              var d = a.staff.edges.find(e => e.role === "Director").node;
              var dirs = [d]; //Directors to display
              dirs.push(randomProducerNotInList(directors, dirs));
              dirs.push(randomProducerNotInList(directors, dirs));

              shuffle(dirs);

              //Add images
              $(".topRow").append($("<div class='imageContainer slideInDown animated'><img src='"+a.coverImage.large+"'/><h3>"+a.title.romaji+"</h3></div>"));

              dirs.forEach((e,i) => $(".bottomRow").append($("<div class='imageContainer slideInUp animated'><img src='"+e.image.large+"'/><h3>"+e.name.first + " " + e.name.last +"</h3></div>").val(e.id)));

              //Add Top Bar Info
              $(".roundCounter").text("Round " + (animeCount - anime.length) + "/" + roundCount);
              $(".rightCounter").append($("<span>"+rightCount+"</span>/<span>"+wrongCount+"</span><span><a class='settingsTrigger'> &#9881;</a></span>"));
              $(".settingsTrigger").click(e => $(".overlay").addClass("active"));

              $("#loadingOverlay").fadeOut(250);

              $(".bottomRow .imageContainer").click(function(){
                $(".bottomRow .imageContainer").off();
                $(this).css("bottom", "10px");

                $(".bottomRow .imageContainer").filter((i,e) => $(e).val() == d.id).addClass("right");
                $(".bottomRow .imageContainer:not(.right)").addClass("wrong");

                console.log($(this).val() + " - " + d.id)
                if($(this).val() == d.id) {
                  console.log("RIGHT");
                  $(".roundSection").addClass("right");
                  rightCount++;
                } else {
                  console.log("WRONG");
                  $(".roundSection").addClass("wrong");
                  wrongCount++;
                }
                $(".topBar .loadingSlider").css("transition", "width " + nextRoundTime + "ms").css("width", "100%");
                setTimeout(getRoundScreen, nextRoundTime);
              });
            });
          }

        });

      }

      //getRoundScreen();
    }
  });
}

function randomArrayElementAndDelete(list) {
  var i = Math.floor(Math.random()*list.length);
  var a = list[i];
  list.splice(i, 1);
  return a;
}

function randomProducerNotInList(list, excl) {
  var e;
  do {
    e = list[Math.floor(Math.random()*list.length)];
    if(excl)
      for(var i=0; i<excl.length; i++) {
        if(excl[i].id === e.id){
          e = undefined;
          break;
        }
      }
  } while(!e);
  return e;
}

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}
