import json
from django.contrib.auth.models import User
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseForbidden
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.reverse import reverse
from board.models import Board, PostIt, Line
from board.serializers import PostitSerializer, LineSerializer, BoardSerializer, UserProfileSerializer
from accounts.models import UserProfile


def home(request):
    visited_boards = []
    if 'visited' in request.session:
        visited_boards = request.session['visited']
    return render_to_response('home.html', {'visited_boards': visited_boards}, context_instance=RequestContext(request))

@csrf_exempt
def subscribe(request):

    if "email" not in request.POST or not validateEmail(request.POST["email"]):
        json_data = json.dumps({"result":"Pleas enter a valid email"})
        return HttpResponse(json_data, mimetype="application/json")

    if request.is_ajax():
        email = request.POST["email"]
        try:
            User.objects.get(email__exact=email)
            json_data = json.dumps({"result":"The email is already registered"})
        except User.DoesNotExist:
            user = User.objects.create_user(email, email)
            user.save()
            json_data = json.dumps({"result":"Subscribed!"})
        return HttpResponse(json_data, mimetype="application/json")
    else:
        return HttpResponse(status=400)

def validateEmail(email):
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    try:
        validate_email( email )
        return True
    except ValidationError:
        return False

def create_board(request):
    new_board = Board()
    new_board.save()

    welcomePostit = PostIt(text="Welcome! Move me! Edit me! Delete me!",x=120,y=50, board=new_board, width=100,
                           height=100)
    sharePostit = PostIt(text="Share this board and work together in realtime!\n\nhttp://www.boardino.com/"+new_board.hash,
                    x=200,
                    y=300,
                    board=new_board,
                    width=220,
                    height=100,
                    back_color='#FF69B4')
    comeBackPostit = PostIt(text="Come back to check new features!",x=550,y=50, board=new_board,
                            width=150,
                            height=100,
                            back_color='#ADFF2F')
    welcomePostit.save()
    sharePostit.save()
    comeBackPostit.save()

    return HttpResponseRedirect("/"+new_board.hash)

def authorize_board(request, board_hash):
    board = get_object_or_404(Board, hash=board_hash)
    if request.POST:
        password = request.POST["password"]
        if password==board.password:
            request.session['board_'+str(board.id)] = {"authorized":True}
            return HttpResponseRedirect("/"+board_hash)
        else:
            return render_to_response('authorize.html',{'board': board}, context_instance=RequestContext(request))
    else:
        return render_to_response('authorize.html',{'board': board}, context_instance=RequestContext(request))

def board(request, board_hash):
    board = get_object_or_404(Board, hash=board_hash)
    if board.password:
        if 'board_'+str(board.id) not in request.session:
            return HttpResponseRedirect("/"+board_hash+"/authorize")
    if request.user.is_authenticated() :
        profile = request.user.get_profile()
        profile.boardinos.add(board)
        profile.save()
    if 'visited' in request.session and board_hash not in request.session['visited']:
        visited_boards = request.session['visited']
        visited_boards.insert(0, board_hash)
        request.session['visited'] = visited_boards
    else:
        request.session['visited'] = [board_hash]
    return render_to_response('board.html',{'board_hash': board.hash, 'postits':board.postit_set.all()}, context_instance=RequestContext(request))

@csrf_exempt
def clear_lines(request, board_hash):
    board = get_object_or_404(Board, hash=board_hash)
    Line.objects.filter(board=board).delete()

    json_data = json.dumps({"result":"OK"})

    if request.is_ajax():
        return HttpResponse(json_data, mimetype="application/json")
    else:
        return HttpResponse(status=400)

def clone(request, board_hash):
    board = get_object_or_404(Board, hash=board_hash)
    new_board = Board()
    new_board.save()

    for postit in board.postit_set.all():
        postit_clone = postit.clone()
        postit_clone.board = new_board
        postit_clone.save()

    for line in board.line_set.all():
        line_clone = line.clone()
        line_clone.board = new_board
        line_clone.save()

    return HttpResponseRedirect("/"+new_board.hash)

@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        'postits':reverse('postit-list', request=request)
    })


class PostitList(generics.ListCreateAPIView):
    model = PostIt
    serializer_class = PostitSerializer

    def get_queryset(self):
        board_hash = self.kwargs['board_hash']
        board = get_object_or_404(Board, hash=board_hash)
        return PostIt.objects.filter(board__id=board.id)

    def pre_save(self, postit):
        board_hash = self.kwargs['board_hash']
        board = get_object_or_404(Board, hash=board_hash)
        postit.board = board


class PostitDetail(generics.RetrieveUpdateDestroyAPIView):
    model = PostIt
    serializer_class = PostitSerializer


class LineList(generics.ListCreateAPIView):
    model = Line
    serializer_class = LineSerializer

    def get_queryset(self):
        board_hash = self.kwargs['board_hash']
        board = get_object_or_404(Board, hash=board_hash)
        return Line.objects.filter(board__id=board.id)

    def pre_save(self, line):
        board_hash = self.kwargs['board_hash']
        board = get_object_or_404(Board, hash=board_hash)
        line.board = board

class LineDetail(generics.RetrieveUpdateDestroyAPIView):
    model = Line
    serializer_class = LineSerializer

class BoardDetail(generics.RetrieveUpdateDestroyAPIView):
    model = Board
    serializer_class = BoardSerializer
    lookup_field = 'hash'

    def pre_save(self, board):
        pass

    def post_save(self, board, created=False):
        if 'board_'+str(board.id) in self.request.session:
            del self.request.session['board_'+str(board.id)]

class ProfileDetail(generics.RetrieveUpdateAPIView):
    model = UserProfile
    serializer_class = UserProfileSerializer

    def get_object(self):
        profile = get_object_or_404(UserProfile, user=self.request.user)
        return profile
    