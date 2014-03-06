/*globals requirejs:false, define:false, $:false, _:false, Backbone:false*/
requirejs.config({
  baseUrl: "",
  paths: {
    vendor: "static/assets/vendor",
    jquery: "static/assets/vendor/jquery",
    "jquery-ui": "static/assets/vendor/jquery-ui.min",
    bootstrap: "static/assets/vendor/bootstrap.min",
    backbone: "static/assets/vendor/backbone-min",
    underscore: "static/assets/vendor/underscore-min",
    json2: "static/assets/vendor/json2",
    paper: "static/assets/vendor/paper",
    io: "static/assets/vendor/socket.io.min"
  },
  shim: {
    "jquery-ui": {
      exports: "$",
      deps: ['jquery']
    },
    "bootstrap": {
      exports: "$",
      deps: ['jquery']
    },
    underscore: {
      exports: "_"
    },
    backbone: {
      deps: ["jquery", "underscore", "json2"],
      exports: "Backbone"
    },
    paper : {
      exports: "paper"
    },
    io: {
      exports: "io"
    }
  } 
});

define([
  "jquery",
  "backbone",
  "app"
  ],

  function($, Backbone, App) {

      function getCookie(name) {
          var cookieValue = null;
          if (document.cookie && document.cookie !== '') {
              var cookies = document.cookie.split(';');
              for (var i = 0; i < cookies.length; i++) {
                  var cookie = $.trim(cookies[i]);
                  // Does this cookie string begin with the name we want?
                  if (cookie.substring(0, name.length + 1) === (name + '=')) {
                      cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                      break;
                  }
              }
          }
          return cookieValue;
      }

      Backbone._sync = Backbone.sync;
      Backbone.sync = function(method, model, options) {
          if (method == 'create' || method == 'update' || method == 'delete' || method == 'post' || method == 'get') {
              var csrfToken = getCookie('csrftoken');

              options.beforeSend = function(xhr){
                  xhr.setRequestHeader('X-CSRFToken', csrfToken);
              };
          }
          return Backbone._sync(method, model, options);
      };

      App.initialize();

      console.log("jQuery version: ", $.fn.jquery);
      $(function(){
          console.log("Backbone: ", Backbone.VERSION);
      });
      return {};
});

/* globals $:false, define:false, document:false, window:false */
define("app",[
  'jquery',
  'app/views/main',
  'app/views/board',
  'app/views/canvas',
  'app/boardconnection',
  'app/boardmessagehandler',
  'app/toolbar',
  'app/utils',
  'app/models/board',
  'bootstrap'
], 

function($, MainView, BoardView, BoardCanvas, BoardConnection, BoardMessageHandler, Toolbar, Utils){
    var initialize = function(){

        var boardConnection, boardView;// Added

        function initBoard(){
          var boardId = Utils.getBoardId();
          var boardMessageHandler = new BoardMessageHandler();
          boardConnection = new BoardConnection(boardId, boardMessageHandler);
          boardView = new BoardView({boardConnection: boardConnection});
          boardMessageHandler.setBoardView(boardView);

          var mainView = new MainView({boardView: boardView, boardId: boardId});
          mainView.render();
        }

        $(document).ready(function() {
          initBoard();
          loadToolbar();
          var pencil_tool = $("#pencil_tools");
          pencil_tool.mouseover(function(){
              $("#pencil_green_tool").fadeIn('fast');
              $("#pencil_red_tool").fadeIn('fast');
              $("#pencil_blue_tool").fadeIn('fast');
          });
          pencil_tool.mouseleave(function(){
              $("#pencil_green_tool").fadeOut('fast');
              $("#pencil_red_tool").fadeOut('fast');
              $("#pencil_blue_tool").fadeOut('fast');
          });

          $(window).bind("beforeunload", function() {
            boardConnection.disconnect();
          });
        });

        function loadToolbar(){
            var toolbar = new Toolbar();
            toolbar.addTool($("#eraser_tool").tool(toolbar, {
                    "action": function(){
                        $("#board").css('cursor','url(/static/images/eraser_disabled.ico),default');
                        boardView.selectEraserTool();
                    }
            }));

            toolbar.addTool($("#postit_tool").tool(toolbar, {
                    "action": function(){
                        $("#board").css('cursor','url(/static/images/postit_disabled.ico),default');
                        boardView.selectPostitTool();
                    }
            }));

            toolbar.addTool($("#pencil_black_tool").tool(toolbar, {
                    "action": function(){}
            }));

            toolbar.addTool($("#pencil_black_tool").tool(toolbar, {
                    "action": function(){
                        $("#board").css('cursor','url(/static/images/pencil_disabled.ico),default');
                        boardView.selectPencilTool("black");
                    }
            }));

            toolbar.addTool($("#pencil_green_tool").tool(toolbar, {
                    "action": function(){
                        $("#board").css('cursor','url(/static/images/pencil_green_disabled.ico),default');
                        boardView.selectPencilTool("green");
                        $("#pencil_black_tool").addClass("tool_enabled");
                   }
            }));

            toolbar.addTool($("#pencil_red_tool").tool(toolbar, {
                    "action": function(){
                        $("#board").css('cursor','url(/static/images/pencil_red_disabled.ico),default');
                        boardView.selectPencilTool("red");
                        $("#pencil_black_tool").addClass("tool_enabled");
                    }
            }));

            toolbar.addTool($("#pencil_blue_tool").tool(toolbar, {
                    "action": function(){
                        $("#board").css('cursor','url(/static/images/pencil_blue_disabled.ico),default');
                        boardView.selectPencilTool("blue");
                        $("#pencil_black_tool").addClass("tool_enabled");
                    }
            }));

            toolbar.addTool($("#clear_lines_tool").tool(toolbar, {
                    "action": function(){
                        boardView.clearLines();
                    },
                    "confirmable": true,
                    "exclusive": false
            }));

            toolbar.addTool($("#rectline_tool").tool(toolbar, {
                    "action": function(){
                        $("#board").css('cursor','crosshair');
                        boardView.selectRectLineTool("FF000000");
                    }
            }));

          toolbar.addTool($("#text_tool").tool(toolbar, {
            "action": function(){
                $("#board").css('cursor','crosshair');
                boardView.selectTextTool();
            }
          }));
        }
  };

  return {
    initialize: initialize
  };
});

/* globals define:false, io:false, window:false, $:false */
define("app/boardconnection",[
    'jquery',
    'io',
    'app/models/userprofile',    
],

function($,io,UserProfile) {

    'use strict';

    function BoardConnection(board_id, boardMessageHandler) {
        this.ws = io.connect( 'http://' + window['ws_host'] );

        var _this = this;
        _this.user = new UserProfile();
        this.ws.on('connect', function () {
            _this.user.fetch({ 
                success: function(userProfile){
                    if(userProfile.get('user')){
                        _this.user = userProfile.get('user');
                    } else{
                        var id = Math.floor((Math.random()*1000)+1);
                        _this.user = {id: id, username: 'guess'};
                    }
                    _this.subscribe(board_id, _this.user);
                    _this.ws.on('message', function (msg) {
                        boardMessageHandler.handle($.parseJSON(msg));
                    });
                },
                error: function(e){
                    var id = Math.floor((Math.random()*1000)+1);
                    _this.user = {id: id, username: 'anonymous'};
                    _this.subscribe(board_id, _this.user);
                    _this.ws.on('message', function (msg) {
                        boardMessageHandler.handle($.parseJSON(msg));
                    });
                }
            });
        });
    }

    BoardConnection.prototype.disconnect = function(){
        this.ws.disconnect();
    };

    BoardConnection.prototype.send = function(message, args){
        if (!args["channel_id"]) {
            args["channel_id"] = this.board_id;
            args["user"] = this.user;
        }
        this.ws.send(JSON.stringify({
            "type": message,
            "args": args
        }));
    };

    BoardConnection.prototype.movePostit = function(id, x, y){
        this.send("move",{
                "obj": "postit",
                "id": id,
                "x": x,
                "y": y
        });
    };

    BoardConnection.prototype.moveText = function(id, x, y){
      this.send("move",{
        "obj": "text",
        "id": id,
        "x": x,
        "y": y
      });
    };

    BoardConnection.prototype.resizePostit = function(postItId, width, height){
        this.send("resize", {
                "obj": "postit",
                "id":postItId,
                "w": width,
                "h": height
            });
    };

    BoardConnection.prototype.resizeText = function(textId, width, height){
      this.send("resize", {
        "obj": "text",
        "id": textId,
        "w": width,
        "h": height
      });
    };

    BoardConnection.prototype.updatePostitText = function(postItId, text){
        this.send("update", {
                "obj": "postit",
                "id":postItId,
                "text": text
            });
    };

    BoardConnection.prototype.updateText = function(textId, text){
      this.send("update", {
        "obj": "text",
        "id": textId,
        "text": text
      });
  };

    BoardConnection.prototype.changePostitColor = function(postItId, color, backColor){
        this.send("change_color", {
                "id": postItId,
                "color": color,
                "back_color": backColor
            });
    };

    BoardConnection.prototype.subscribe = function(board_id, user){
        this.board_id = board_id;
        this.send("register",{
            'user': user
        });
    };

    BoardConnection.prototype.newPostit = function(postItId, x, y, width, height, text){
        this.send("new",{
                "obj":"postit",
                "id":postItId,
                "x": x,
                "y": y,
                "w": width,
                "h": height,
                "text":text
            });
    };

    BoardConnection.prototype.newText = function(textId, x, y, width, height, text){
      this.send("new",{
        "obj":"text",
        "id":textId,
        "x": x,
        "y": y,
        "w": width,
        "h": height,
        "text":text
      });
    };

    BoardConnection.prototype.deletePostit = function(postitId){
        this.send("delete",{
                "obj": "postit",
                "id":postitId
            });
    };

    BoardConnection.prototype.deleteText = function(textId){
      this.send("delete",{
        "obj": "text",
        "id": textId
      });
    };

    BoardConnection.prototype.deleteLine = function(id){
        this.send("delete", {
                "obj": "line",
                "id": id
            });
    };


    BoardConnection.prototype.startPath = function(id, x, y, color){
        this.send("startPath",{
                "id": id,
                "x": x,
                "y": y,
                "color": color
            });
    };

    BoardConnection.prototype.addPathPoint = function(id, x, y){
        this.send("addPathPoint",{
                "id": id,
                "x": x,
                "y": y
            });
    };

    BoardConnection.prototype.finishPath = function(id){
        this.send("finishPath",{
                "id": id
            });
    };

    return BoardConnection;
});

/* globals define:false, io:false, window:false, $:false */
define("app/boardmessagehandler",[
    'jquery'
],

function($) {

    var BoardMessageHandler = function(){
        var connectedUsers;
        this.boardView = null;
        var _this = this;
        this.handlers = {
            "startPath": function(args){
                _this.boardView.startPath(args["id"], args["x"], args["y"], args["color"]);
            },
            "addPathPoint": function(args){
                _this.boardView.addPathPoint(args["id"], args["x"], args["y"]);
            },
            "finishPath": function(args){
                _this.boardView.finishPath(args["id"]);
            },
            "new" : function(args){
                if(args["obj"]==="postit") {
                  _this.boardView.showPostit(args["id"]);
                } else if(args["obj"]==="text"){
                  _this.boardView.showText(args["id"]);
                }
            },
            "update" : function(args){
              if(args["obj"]==="postit") {
                _this.boardView.updatePostitText(args["id"], args["text"]);
              } else if(args["obj"]==="text"){
                _this.boardView.updateText(args["id"], args["text"]);
              }
            },
            "move" : function(args){
              if(args["obj"]==="postit") {
                _this.boardView.movePostit(args["id"], args["x"], args["y"]);
              } else if(args["obj"]==="text") {
                _this.boardView.moveText(args["id"], args["x"], args["y"]);
              }
            },
            "resize" : function(args){
              if(args["obj"]==="postit") {
                _this.boardView.resizePostit(args["id"], args["w"], args["h"]);
              } else if(args["obj"]==="text") {
                _this.boardView.resizeText(args["id"], args["w"], args["h"]);
              }
            },
            "delete" : function(args){
                if(args["obj"]==="postit") {
                    _this.boardView.deletePostit(args["id"]);
                } else if(args["obj"]==="line") {
                    _this.boardView.deleteLine(args["id"]);
                } else if(args["obj"]==="text") {
                  _this.boardView.deleteText(args["id"]);
                }
            },
            "change_color" : function(args){
                _this.boardView.changePostitColor(args["id"], args["back_color"]);
            },
            "info" : function(args){
                connectedUsers = args.connected_users+1;
                $("#connected_users").text(connectedUsers);
                for(var u in args['users']){
                    var user = args['users'][u];
                    if(user['username'] === 'guess'){
                        $("#online_users").append('<br><a href="#" id="user_'+user['username']+'_'+user['id']+'">'+user['username']+'</a>');
                    } else {
                        $("#online_users").append('<br><a href="/accounts/'+user['username']+'" id="user_'+user['username']+'_'+user['id']+'" target="_blank">'+user['username']+'</a>');
                    }
                }
            },
            "register": function(args){
                connectedUsers++;
                $("#connected_users").text(connectedUsers);
                $("<div/>").addClass("user_connected")
                    .appendTo($("#notifications")).text(args['user']['username']+" has joined!").show('slow')
                    .hide(4000, function(){$(this).remove();});

                if(args['user']['username'] === 'guess'){
                    $("#online_users").append('<br><a href="#" id="user_'+args['user']['username']+'_'+args['user']['id']+'">'+args['user']['username']+'</a>');
                } else{
                    $("#online_users").append('<br><a href="/accounts/'+args['user']['username']+'" id="user_'+args['user']['username']+'_'+args['user']['id']+'" target="_blank">'+args['user']['username']+'</a>');
                }
            },
            "disconnect": function(args){
                connectedUsers--;
                $("#connected_users").text(connectedUsers);
                $("<div/>").addClass("user_disconnected")
                    .appendTo($("#notifications")).text(args['username'] + " has left!").show('slow')
                    .hide(4000, function(){$(this).remove();});

                $("#user_"+args['username']+'_'+args['id']).hide(2000, function(){$(this).remove();});
            }
        };

    };

    BoardMessageHandler.prototype.handle = function(message){
        var messageType = message["type"];
        if(this.handlers[messageType]) {
            this.handlers[messageType](message["args"]);
        }
    };

    BoardMessageHandler.prototype.setBoardView = function(boardView){
        this.boardView = boardView;
    };

    return BoardMessageHandler;
});

/*globals define:false*/
define('app/collections/lines',[
  'backbone',
  'app/models/line',
  'app/utils'

],

function(Backbone, Line, Utils){
    var boardId = Utils.getBoardId();
    var LineList = Backbone.Collection.extend({
        model: Line,
        url: "api/boards/"+boardId+"/lines/"
    });
    return LineList;
});

/*globals define:false*/
define('app/collections/postits',[
  'backbone',
  'app/models/postit',
  'app/utils'

],

function(Backbone, Postit, Utils){
    var boardId = Utils.getBoardId();
    var PostitList = Backbone.Collection.extend({
        model: Postit,
        url: "api/boards/"+boardId+"/postits/"
    });
    return PostitList;
});

/*globals define:false*/
define('app/collections/texts',[
  'backbone',
  'app/models/text',
  'app/utils'

], function(Backbone, Text, Utils){
    var boardId = Utils.getBoardId();
    var TextList = Backbone.Collection.extend({
      model: Text,
      url: "api/boards/"+boardId+"/texts/"
    });
    return TextList;
  });


/*globals define:false*/
define('app/models/board',[
  'backbone'
], function(Backbone){
  var Board = Backbone.Model.extend({
    urlRoot: "api/boards/"
  });
  return Board;
});
/*globals define:false*/
define('app/models/line',[
    'backbone',
    'app/utils'
],

function(Backbone, Utils){
    var boardId = Utils.getBoardId();
    var Line = Backbone.Model.extend({
        urlRoot: "api/boards/"+boardId+"/lines/",

        initialize: function(){

        }
    });
    return Line;
});

/*globals define:false*/
define('app/models/postit',[
    'backbone',
    'app/utils'
], function(Backbone, Utils){
    var boardId = Utils.getBoardId();
    var Postit = Backbone.Model.extend({
        urlRoot: "api/boards/"+boardId+"/postits/",

        initialize: function(){
        }
    });
    return Postit;
});


/*globals define:false*/
define('app/models/text',[
  'backbone',
  'app/utils'
], function(Backbone, Utils){
  var boardId = Utils.getBoardId();
  var Text = Backbone.Model.extend({
    urlRoot: "api/boards/"+boardId+"/texts/",

    initialize: function(){
    }
  });
  return Text;
});



/*globals define:false*/
define('app/models/userprofile',[
  'backbone'
], function(Backbone){
  var UserProfile = Backbone.Model.extend({
    urlRoot: "api/profile/"
  });
  return UserProfile;
});
/* globals define:false, jQuery:false */
define('app/toolbar',[
    'jquery'
],

function($) {

    var Toolbar = function Toolbar(){
        this.tools = [];
    };

    Toolbar.prototype.addTool = function(tool){
        this.tools.push(tool);
    };

    (function($){
        $.fn.tool = function(toolbar, options){

            var settings = $.extend({
                                        'element': this,
                                        'exclusive': true
            }, options);

            this.click(function(){
                if(settings.exclusive){
                    $.each(toolbar.tools, function(i, otherTool){
                        otherTool.element.removeClass('tool_enabled');
                    });
                }
                $(this).addClass('tool_enabled');
                if(settings.confirmable){
                    $("#dialog").dialog({
                                            buttons : {
                                                "Confirm" : function() {
                                                    $(this).dialog("close");
                                                    settings.action();
                                                },
                                                "Cancel" : function() {
                                                    $(this).dialog("close");
                                                }
                                            }
                                        });
                } else {
                    settings.action();
                }
            });

            return settings;
        };
    })(jQuery);

    return Toolbar;
});

/*globals define:false, window:false */
define("app/utils",[
	'backbone',
	'app/models/userprofile'
],

function(Backbone, UserProfile){

	function getBoardId() {
		var urlparam = window.location.pathname.replace(/^\/([^\/]*).*$/, '$1');
		return (urlparam)? urlparam : "";
	}

    return {

        getBoardId: getBoardId,
        
    };
    
});
/*globals define:false*/
define('app/views/board',[
  'jquery',
  'backbone',
  'app/views/postit',
  'app/views/canvas',
  'app/views/text',
  'app/models/board',
  'app/models/postit',
  'app/models/text',
  'app/collections/postits',
  'app/collections/texts'
], 

function($, Backbone, PostitView, BoardCanvas, TextView, Board, Postit, Text, PostitList, TextList){
    var BoardView = Backbone.View.extend({
        el: $("#board"),

        events: {
            "mousedown #board-canvas": "mousedown",
            "mousemove": "mouseMove",
            "mouseup": "mouseUp"
        },

        initialize: function(attrs){
          this.boardConnection = attrs.boardConnection;

          this.tool = "postits";
          this.canvas = new BoardCanvas({boardConnection: this.boardConnection});
          this.canvas.render();

          this.postits = new PostitList();
          this.postits.bind('add', this.addOne, this);
          this.postits.bind('reset', this.addAll, this);
          this.postits.bind('all', this.render, this);
          this.postits.fetch();

          this.texts = new TextList();
          this.texts.bind('add', this.addOneText, this);
          this.texts.bind('reset', this.addAllTexts, this);
          this.texts.bind('all', this.render, this);
          this.texts.fetch();
        },

        mousedown: function(e){
            if (this.tool === "drawing") {
                this.canvas.startLine(e.pageX, e.pageY, "free");
            }
            if (this.tool === "rectDrawing") {
                this.canvas.startLine(e.pageX, e.pageY, "rect");
            }
            if (this.tool === "eraser") {
                this.canvas.tryToErase(e.pageX, e.pageY);
            }
            var _this = this;
            if (this.tool === "postits") {
                var postit = new Postit({"x":e.pageX, "y":e.pageY, "width":120, "height":120, "text":""});
                this.postits.add(postit);//TODO: check what is this doing
                postit.save(null, {
                    success: function(model, response){
                        _this.boardConnection.newPostit(model.get("id"), postit.get("x"), postit.get("y"), postit.get("width"), postit.get("height"), postit.get("text"));
                    }
                });
                postit.trigger('focus');
            }
            if (this.tool === "text") {
              var text = new Text({
                text: "",
                x: e.pageX,
                y: e.pageY,
                width: 150,
                height: 50
              });
              var view = new TextView({model: text, boardConnection: this.boardConnection});
              $("#board").append(view.render().el);

              text.save(null, {
                success: function(model, response){
                  _this.boardConnection.newText(model.get("id"), text.get("x"), text.get("y"), text.get("width"), text.get("height"), text.get("text"));
                }
              });
            }
            return false;
        },

        mouseMove: function(e){
            if(this.tool === "drawing" || this.tool === "rectDrawing"){
                this.canvas.mouseMove(e);
            }
        },

        mouseUp: function(e){
            if(this.tool === "drawing" || this.tool === "rectDrawing"){
                this.canvas.finishLine(e);
            }
        },

        showPostit: function(id){
            var postit = new Postit({id:id});
            postit.fetch();
            this.postits.add(postit);
        },
        showText: function(id){
          var _this = this;
          var text = new Text({id:id});
          text.fetch({
            success: function(){
              _this.texts.add(text);
            }
          });
        },
        addAll: function() {
            this.postits.each(this.addOne, this);
        },
        addAllTexts: function() {
            this.texts.each(this.addOneText, this);
        },
        addOne: function(postit){
            var view = new PostitView({model: postit, boardConnection: this.boardConnection});
            $("#board").append(view.render().el);
        },
        addOneText: function(text){
          var view = new TextView({model: text, boardConnection: this.boardConnection});
          $("#board").append(view.render().el);
        },
        movePostit: function(id, newX, newY){
            this.postits.get(id).set({x: newX, y: newY});
        },
        moveText: function(id, newX, newY){
          this.texts.get(id).set({x: newX, y: newY});
        },
        resizePostit: function(id, width, height){
            this.postits.get(id).set({width: width, height: height});
        },
        resizeText: function(id, width, height){
          this.texts.get(id).set({width: width, height: height});
        },
        changePostitColor: function(id, color){
            this.postits.get(id).set("back_color", color);
        },

        deletePostit: function(id){
            this.postits.remove(id);
        },

        deleteText: function(id){
          this.texts.remove(id);
        },

        updatePostitText: function(id, text){
            this.postits.get(id).set("text",text);
        },

        updateText: function(id, text){
          this.texts.get(id).set("text", text);
        },

        startPath: function(id, x, y, color){
            this.canvas.startPath(id, x, y, color);
        },

        addPathPoint: function(id, x, y){
            this.canvas.addPathPoint(id, x, y);
        },

        finishPath: function(id){
            this.canvas.finishPath(id);
        },

        selectPostitTool: function(){
            this.tool = "postits";
        },

        selectPencilTool: function(color){
            this.tool = "drawing";
            this.canvas.setStrokeColor(color);
        },

        selectRectLineTool: function(){
            this.tool = "rectDrawing";
            this.canvas.setStrokeColor("black");
        },

        selectEraserTool: function(){
            this.tool = "eraser";
        },

        selectTextTool: function(){
            this.tool = "text";
        },

        clearLines: function(){
            this.canvas.clearLines();
        },

        deleteLine: function(id){
            this.canvas.deleteLine(id);
        }
    });

    return BoardView;
});

/*globals define:false*/
define('app/views/canvas',[
    'jquery',
    'backbone',
    'underscore',
    'paper',
    'app/models/line',
    'app/collections/lines'
], 

function($, Backbone, _, paper, Line, LineList){
    var BoardCanvas = Backbone.View.extend({
        el: $("#board-canvas"),

        lines : new LineList(),

        initialize: function(attrs){
            this.boardConnection = attrs.boardConnection;
            this.strokeColor = "black";
            var _this = this;
            this.lines.fetch({success: function(lineList){
                _.each(lineList.models, function(line){
                    if(line.get("path")){
                        line.path = _this.lineToPath(line);
                        line.path.model = line;
                    }
                });
                paper.view.draw();
            }});
            var canvas = this.el;
            paper.setup(canvas);
        },

        render: function(){
            paper.view.draw();
        },

        startLine: function(x, y, type){
          var line = new Line();
          line.set("color_l",this.strokeColor);
          line.type = type;

          this.shadowPath = new paper.Path();
          this.shadowPath.strokeColor = this.strokeColor;
          this.shadowPath.dashArray = [10, 12];

          var path = new paper.Path();
          path.model = line;

          path.strokeColor = this.strokeColor;
          var start = new paper.Point(x, y);
          path.add(start);
          this.shadowPath.add(start);

          var _this = this;
          line.save({"stroke_w":1},{
            success: function(model, response){
              _this.line = model;
              _this.line.path = path;
              _this.lines.add(model);
              _this.boardConnection.startPath(model.get("id"), x, y, model.get("color_l"));
              paper.view.draw();
            }
          });
        },

        mouseMove: function(e){
            var _this = this;
            setTimeout(function() {
                if(_this.line && e.which === 1){
                  if(_this.line.type === "free") {
                    _this.line.path.add(new paper.Point(e.pageX, e.pageY));
                    _this.boardConnection.addPathPoint(_this.line.get("id"), e.pageX, e.pageY);
                  } else {
                    _this.shadowPath.removeSegment(1);
                    _this.shadowPath.add(new paper.Point(e.pageX, e.pageY));
                  }
                }
                paper.view.draw();
            }, 0);
        },

        finishLine: function(e){
          if(this.line.type === "rect"){
            this.shadowPath.remove();
            this.line.path.add(new paper.Point(e.pageX, e.pageY));
            this.boardConnection.addPathPoint(this.line.get("id"), e.pageX, e.pageY);
          }
          else{
            this.line.path.simplify(10);
          }
          paper.view.draw();
          this.boardConnection.finishPath(this.line.get("id"));
          this.line.save({path: this.serialize(this.line.path)});
          this.line = null;
        },

        serialize: function(path){
            var pathToSerialize = [];
            $.each(path.getSegments(), function(i, segment){
                var segmentToSerialize = {
                    point: {x: segment.getPoint().x, y: segment.getPoint().y},
                    handleIn :  {x: segment.getHandleIn().x, y: segment.getHandleIn().y},
                    handleOut :  {x: segment.getHandleOut().x, y: segment.getHandleOut().y}
                };
                pathToSerialize.push(segmentToSerialize);
            });
            return JSON.stringify(pathToSerialize);
        },

        lineToPath: function(line){
            var path = new paper.Path();
            path.strokeColor = line.get("color_l");
            $.each($.parseJSON(line.get("path")), function(i, segment){
                path.add(new paper.Segment(segment.point, segment.handleIn, segment._handleOut));
            });
            return path;
        },

        startPath: function(id, x, y, color){
            var line = new Line({id:id});
            var path = new paper.Path();
            path.add(new paper.Point(x, y));
            line.path = path;
            line.path.model = line;
            line.fetch({
                success: function(model){
                    path.strokeColor = model.get("color_l");
                }
            });
            this.lines.add(line);
        },

        addPathPoint: function(id, x, y){
            this.lines.get(id).path.add(new paper.Point(x, y));
            paper.view.draw();
        },

        finishPath: function(id){
            this.lines.get(id).path.simplify(10);
            paper.view.draw();
        },

        setStrokeColor: function(color){
            this.strokeColor = color;
        },

        clearLines: function(color){
            var _this = this;
            _.chain(this.lines.models).clone().each(function(model){
                if (model.path) {
                    model.path.remove();
                }
                model.destroy();
                _this.boardConnection.deleteLine(model.get("id"));
            });
            paper.view.draw();
        },

        tryToErase: function(x, y){
            var hitOptions = {
                segments: true,
                stroke: true,
                fill: true,
                tolerance: 5
            };
            var hitResult = paper.project.hitTest(new paper.Point(x,y), hitOptions);
            if(hitResult){
                hitResult.item.remove();
                this.boardConnection.deleteLine(hitResult.item.model.get("id"));
                hitResult.item.model.destroy();
                paper.view.draw();
            }
        },

        deleteLine: function(id){
            if( this.lines.get(id)){
                this.lines.get(id).path.remove();
                paper.view.draw();
            }
        }
    });

    return BoardCanvas;
});

/*globals define:false*/
define('app/views/main',[
  'jquery',
  'backbone',
  'app/views/postit',
  'app/views/canvas',
  'app/models/board',
  'app/models/postit',
  'app/collections/postits'
], function($, Backbone, PostitView, BoardCanvas, Board, Postit, PostitList){
  var MainView = Backbone.View.extend({
    el: $("body"),
    events: {
      "mouseover #menu_tool": "showMenu",
      "mouseleave #menu_tool": "leaveMenuTool",
      "mouseleave #menu": "leaveMenu",
      "mouseenter #menu": "enteredMenu",
      "click #set-password": "showSetPasswordModal",
      "click #set-alias": "showSetAliasModal",
      "click #set-password-btn": "setBoardPassword",
      "click #set-alias-btn": "setBoardAlias"
    },
    initialize: function(attrs){
      this.boardView = attrs.boardView;
      var boardId = attrs.boardId;
      this.board = new Board({id: boardId});
      this.menu = $("#menu");
      this.menu.menu();
      $("#set-password-modal").modal({show:false});
      $("#set-alias-modal").modal({show:false});
    },
    render: function() {
      var _this = this;
      this.board.fetch({success: function(){
        _this.boardView.render();
      }});
    },
    showMenu: function() {
        clearTimeout(this.menu.data('timeoutId'));
        this.menu.show();
    },
    leaveMenu: function() {
      this.menu.fadeOut('fast');
    },
    enteredMenu: function() {
      clearTimeout(this.menu.data('timeoutId'));
    },
    leaveMenuTool: function(){
        var menu = this.menu;
        var timeoutId = setTimeout(function(){
            menu.fadeOut('fast');
        }, 200);
        this.menu.data('timeoutId', timeoutId);
    },
    showSetPasswordModal: function(e) {
      e.preventDefault();
      $("#set-password-modal").modal('show');
    },
    showSetAliasModal: function(e) {
      e.preventDefault();
      $("board-alias").val(this.board.get("hash"));
      $("#set-alias-modal").modal('show');
    },
    setBoardPassword: function(e) {
      e.preventDefault();
      $("#set-password-btn").attr('disabled','disabled');
      var passwordInput = $("#board-password");
      var passwordConfirmInput = $("#board-password2");
      var password = passwordInput.val();
      var passwordConfirmation = passwordConfirmInput.val();
      if (password === passwordConfirmation) {
        this.board.set("password", password);
        this.board.save({}, {success: function(){
          $("#set-password-modal").modal('hide');
          $("#set-password-btn").removeAttr("disabled");
          passwordInput.val("");
          $("set-password-error").hide();
        }});
      } else {
        $("#set-password-error").fadeIn();
        $(this).removeAttr("disabled");
      }
    },
    setBoardAlias: function(e) {
      e.preventDefault();
      $("#set-alias-btn").attr("disabled", "disabled");
      var alias = $("#board-alias").val();
      if(/[^a-zA-Z0-9]/.test(alias)){
        $("#set-alias-error").fadeOut().fadeIn();
        $("#set-alias-btn").removeAttr("disabled");
      } else {
        this.board.set("hash", alias);
        this.board.save({},
          {
            success: function(){
              $("#set-alias-modal").modal('hide');
              $("#set-alias-btn").removeAttr("disabled");
              $("set-alias-error").hide();
              window.location.href = "/"+alias;
            },
            error: function(model, response){
              var responseObj = $.parseJSON(response.responseText);
              if (responseObj["hash"]) {
                $("#set-alias-error-msg").html(responseObj["hash"][0]);
              }else {
                $("#set-alias-error-msg").html("There was an unknown error. Try again.");
              }
              $("#set-alias-btn").removeAttr("disabled");
              $("#set-alias-error").fadeOut().fadeIn();
            }
          }
        );
      }
    }
  });
  return MainView;
});
/*globals define:false*/
define('app/views/postit',[
    'jquery-ui',
    'backbone'
], 

function($, Backbone){
    var PostitView = Backbone.View.extend({
        tagName: "div",

        events: {
            "mouseover": "showToolbar",
            "mouseout": "hideToolbar",
            "click .postit_close_image": "deletePostit",
            "mouseover .postit_color_image": "showColors",
            "keyup .postit_input": "updateText"
        },

        initialize: function(attrs){
            this.boardConnection = attrs.boardConnection;
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.remove, this);
            this.model.bind('remove', this.remove, this);
            this.model.bind('focus', this.focus, this);
            var _this = this;
            this.$el.attr("id", "postit"+this.model.id)
                    .addClass("postit")
                    .css("position", "absolute")
                    .css("top", this.model.get("y")+"px")
                    .css("left", this.model.get("x")+"px")
                    .css("width", this.model.get("width")+"px")
                    .css("height", this.model.get("height")+"px")
                    .css("padding", "22px 2px 2px 2px")
                    .css("background-color", this.model.get("back_color"))
                    .draggable({
                        stack: ".postit",
                        cursor: "move",
                        containment: "parent",
                        drag: function(){
                            var position = $(this).position();
                            _this.boardConnection.movePostit(_this.model.get("id"), position.left, position.top);
                        },
                        stop: function(){
                            var position = $(this).position();
                            _this.model.save({x: position.left, y: position.top});
                        }
                    })
                    .resizable({
                        resize: function(){
                            var width = $(this).width();
                            var height = $(this).height();
                            _this.boardConnection.resizePostit(_this.model.get("id"), width, height);
                        },
                        stop: function(event, ui){
                            var width = ui.size.width;
                            var height = ui.size.height;
                            _this.model.save({width: width, height: height});
                        }
                    });

            this.createPostitCloseElement().appendTo(this.$el);
            this.createPostitColorTool().appendTo(this.$el);
            this.createPostitTextArea().appendTo(this.$el);
            this.createChangePostitColorTool().appendTo(this.$el);

            this.input = this.$('.postit_input');
        },

        focus: function(){
            this.input.focus();
        },

        render: function(){
            this.$el
                .css("top", this.model.get("y")+"px")
                .css("left", this.model.get("x")+"px")
                .css("width", this.model.get("width")+"px")
                .css("height", this.model.get("height")+"px")
                .css("background-color", this.model.get("back_color"));
            this.input.css('background-color', this.model.get("back_color"));
            this.input.val(this.model.get("text"));
            return this;
        },

        createPostitCloseElement: function(){
            return $("<img/>")
                    .addClass("postit_close_image")
                    .attr("src", "/static/images/close.png");
        },

        deletePostit: function(){
            this.model.destroy();
            this.boardConnection.deletePostit(this.model.get("id"));
        },

        createPostitTextArea: function(){
            var postitTextArea =  $("<textarea/>").addClass("postit_input")
                    .css('background-color', this.model.get("back_color"));
            postitTextArea.val(this.model.get("text"));
            return postitTextArea;
        },

        updateText: function(){
            var text = this.input.val();
            this.model.save({text: text},{'silent':true});
            this.boardConnection.updatePostitText(this.model.get("id"), text);
        },

        createPostitColorTool: function(){
            var image = $("<img/>")
                    .addClass("postit_color_image")
                    .attr("src", "/static/images/colors.png");
            return image;
        },

        showColors: function(){
            this.$el.find(".postit_color_tool").show();
        },

        createChangePostitColorTool: function() {
            var postitChangeColorTool = $("<div />")
                    .addClass("postit_color_tool");
            postitChangeColorTool.mouseleave(function() {
                postitChangeColorTool.fadeOut('fast');
            });
            this.createColorSelectionElement("#FFFF33", "left").appendTo(postitChangeColorTool);
            this.createColorSelectionElement("#FF69B4", "right").appendTo(postitChangeColorTool);
            this.createColorSelectionElement("#ADFF2F", "left").appendTo(postitChangeColorTool);
            this.createColorSelectionElement("gold", "right").appendTo(postitChangeColorTool);
            return postitChangeColorTool.hide();
        },

        createColorSelectionElement: function(color, position){
            var _this = this;
            return $("<div class='postit_color'/>")
                    .css('background-color', color)
                    .css('float', position)
                    .click(function() {
                        _this.model.save({"back_color": color});
                        _this.boardConnection.changePostitColor(_this.model.get("id"), color, color);
                    });
        },

        showToolbar: function(){
            this.$el.find(".postit_close_image").show();//showCLoseImage
            this.$el.find(".postit_color_image").show();//showColorImage
            this.$el.css('padding-top','2px');
            this.$el.css('padding-bottom','20px');
        },

        hideToolbar: function(){
            this.$el.find(".postit_close_image").hide();//hideCloseImage
            this.$el.find(".postit_color_image").hide();//hideColorImage
            this.$el.css('padding-top','22px');
            this.$el.css('padding-bottom','2px');
        }
    });
    return PostitView;
});

/*globals define:false*/
define('app/views/text',[
  'jquery-ui',
  'backbone'
], function($, Backbone){
  var TextView = Backbone.View.extend({
    tagName: "div",
    events: {
      "mouseover": "showToolbar",
      "mouseout": "hideToolbar",
      "click .postit_close_image": "deleteText",
      "keyup .text_input": "updateText"
    },
    initialize: function(options)
    {
      this.boardConnection = options.boardConnection;
      this.model.bind('change', this.render, this);
      this.model.bind('remove', this.remove, this);
      var _this = this;
      this.$el.attr("id", "text"+this.model.id)
        .addClass("text");
      this.$el.css("top", this.model.get("y")+"px")
        .css("position", "absolute")
        .css("left", this.model.get("x")+"px")
        .css("padding", "22px 2px 2px 2px")
        .css("width", this.model.get("width")+"px")
        .css("height", this.model.get("height")+"px");
      this.$el.draggable({
        cursor: "move",
        containment: "parent",
        drag: function(){
          var position = $(this).position();
          _this.boardConnection.moveText(_this.model.get("id"), position.left, position.top);
        },
        stop: function(){
          var position = $(this).position();
          _this.model.save({x: position.left, y: position.top});
        }
      }).resizable({
          autoHide: true,
          resize: function(){
            var width = $(this).width();
            var height = $(this).height();
            _this.boardConnection.resizeText(_this.model.get("id"), width, height);
          },
          stop: function(event, ui){
            var width = ui.size.width;
            var height = ui.size.height;
            _this.model.save({width: width, height: height});
          }
        });
      this.createCloseElement().appendTo(this.$el);
      this.createTextArea().appendTo(this.$el);
      this.input = this.$('.text_input');
    },
    render: function(){
      this.$el
        .css("top", this.model.get("y")+"px")
        .css("left", this.model.get("x")+"px")
        .css("width", this.model.get("width")+"px")
        .css("height", this.model.get("height")+"px");
      this.input.val(this.model.get("text"));
      return this;
    },
    createCloseElement: function(){
      return $("<img/>")
        .addClass("postit_close_image")
        .attr("src", "/static/images/close.png");
    },

    createTextArea: function(){
      var textArea =  $("<textarea/>").addClass("text_input");
      textArea.val(this.model.get("text"));
      textArea.attr("placeholder", "Write your text");
      return textArea;
    },
    showToolbar: function() {
      this.$el.find(".postit_close_image").show();
      this.$el.css('padding-top','2px');
      this.$el.css('padding-bottom','20px');
    },
    hideToolbar: function() {
      this.$el.find(".postit_close_image").hide();
      this.$el.css('padding-top','22px');
      this.$el.css('padding-bottom','2px');
    },
    updateText: function() {
      var text = this.input.val();
      var _this = this;
      this.model.save({text: text},{
        'silent':true,
        success: function(){
          _this.boardConnection.updateText(_this.model.get("id"), text);
        }
      });
    },
    deleteText: function() {
      this.remove();
      this.model.destroy();
      this.boardConnection.deleteText(this.model.get("id"));
    }
  });
  return TextView;
});