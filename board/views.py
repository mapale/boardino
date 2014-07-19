import json
from board.mail import send_invitation_email
import re
from datetime import datetime
from django.contrib.auth.models import User
from django.core.exceptions import PermissionDenied
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseForbidden
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.views.decorators.csrf import csrf_exempt
from django.utils.translation import ugettext as _
from rest_framework.decorators import api_view
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from board.forms import BoardForm
from board.models import Board, PostIt, Line, Text
from board.serializers import PostitSerializer, LineSerializer, BoardSerializer, UserProfileSerializer, TextSerializer
from accounts.models import UserProfile, Invitation


# Main Page where you can see the created boards if you're authenticated
def home(request):
    return render_to_response('home.html',
                              {'board_form': BoardForm(request.user)},
                              context_instance=RequestContext(request))

# Let you join to an existing board
@csrf_exempt
def subscribe(request):
    # Chech if you pass a correct email
    if "email" not in request.POST or not validateEmail(request.POST["email"]):
        json_data = json.dumps({"result":_("Please enter a valid email")})
        return HttpResponse(json_data, mimetype="application/json")

    if request.is_ajax():
        email = request.POST["email"]
        try:
            User.objects.get(email__exact=email)
            json_data = json.dumps({"result":"_(The email is already registered)"})
        except User.DoesNotExist:
            user = User.objects.create_user(email, email)
            user.save()
            json_data = json.dumps({"result":_("Subscribed!")})
        return HttpResponse(json_data, mimetype="application/json")
    else:
        return HttpResponse(status=400)

# Validates email
def validateEmail(email):
    from django.core.validators import validate_email
    from django.core.exceptions import ValidationError
    try:
        validate_email( email )
        return True
    except ValidationError:
        return False

# Let create a new board with default PostIts
def create_board(request):

    if request.POST:
        form = BoardForm(request.user, request.POST)

        if form.is_valid():

            new_board = Board()
            new_board.save()

            if request.user.is_authenticated():
                new_board.owner = request.user
                profile = request.user.get_profile()
                if profile.is_premium:
                    profile.boardinos.add(new_board)
                    profile.save()
                    new_board.is_private = True

            new_board.save()

            welcomePostit = PostIt(text=_("Welcome! Move me! Edit me! Delete me!"),x=120,y=50, board=new_board, width=100,
                                   height=100)
            sharePostit = PostIt(text=_("Share this board and work together in realtime!")+ "\n\nhttp://www.boardino.com/"+new_board.hash,
                            x=200,
                            y=300,
                            board=new_board,
                            width=220,
                            height=100,
                            back_color='#FF69B4')
            comeBackPostit = PostIt(text=_("Come back to check new features!"),x=550,y=50, board=new_board,
                                    width=150,
                                    height=100,
                                    back_color='#ADFF2F')
            welcomePostit.save()
            sharePostit.save()
            comeBackPostit.save()

            return HttpResponseRedirect("/"+new_board.hash)

    return HttpResponseRedirect("/")

# Authorize the access to a new person if has the correct password that was assigned to the board
def authorize_board(request, board_hash):
    # Get the board or show a 404 page
    board = get_object_or_404(Board, hash=board_hash)
    if request.POST:
        password = request.POST["password"]
        # Verify if the board has a password
        if password==board.password:
            request.session['board_'+str(board.id)] = {"authorized":True}
            return HttpResponseRedirect("/"+board_hash)
        else:
            return render_to_response('authorize.html',{'board': board}, context_instance=RequestContext(request))
    else:
        return render_to_response('authorize.html',{'board': board}, context_instance=RequestContext(request))

# Show a specific board
def board(request, board_hash):
    # Get the board or show a 404 page
    board = get_object_or_404(Board, hash=board_hash)
    # Verify if the board has a password
    if board.password:
        if 'board_'+str(board.id) not in request.session:
            return HttpResponseRedirect("/"+board_hash+"/authorize")

    # Chech if the user is authenticared
    if request.user.is_authenticated():
        profile = request.user.get_profile()
        if not board in profile.boardinos.all():
            if board.is_private:
                raise PermissionDenied
            else:
                profile.boardinos.add(board)
                profile.save()
    else:
        if board.is_private:
            raise PermissionDenied

    if 'visited' in request.session and board_hash not in request.session['visited']:
        visited_boards = request.session['visited']
        visited_boards.insert(0, board_hash)
        request.session['visited'] = visited_boards
    else:
        request.session['visited'] = [board_hash]

    board.last_visit = datetime.now()
    board.save()

    return render_to_response('board.html',{'board': board, 'postits':board.postit_set.all()}, context_instance=RequestContext(request))

# Clear all drawed lines of the board
@csrf_exempt
def clear_lines(request, board_hash):
    # Get the board or show a 404 page
    board = get_object_or_404(Board, hash=board_hash)
    # Delete all lines
    Line.objects.filter(board=board).delete()

    json_data = json.dumps({"result":"OK"})

    if request.is_ajax():
        return HttpResponse(json_data, mimetype="application/json")
    else:
        return HttpResponse(status=400)

# Clone a board with all their elements
def clone(request, board_hash):
    # Get the board or show a 404 page
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


def download(request, board_hash):
    board = get_object_or_404(Board, hash=board_hash)
    base64image = re.search(r'base64,(.*)', board.screenshot).group(1)
    response = HttpResponse(base64image.decode('base64'), mimetype='image/png')
    response['Content-Disposition'] = 'attachment; filename=boardino_%s.png' % board_hash
    return response

# API
@api_view(['GET'])
def api_root(request, format=None):
    return Response({
        #'postits':reverse('postit-list', request=request)
    })

# Return a json file with a PostIt list with their respectly attributes each one (authorized attributes in PostistSerializer)
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

# Return a json file with a specific PostIt with their respectly attributes (authorized attributes in PostistSerializer)
class PostitDetail(generics.RetrieveUpdateDestroyAPIView):
    model = PostIt
    serializer_class = PostitSerializer

# Return a json file with a Text list with their respectly attributes each one (authorized attributes in TextSerializer)
class TextList(generics.ListCreateAPIView):
    model = Text
    serializer_class = TextSerializer

    def get_queryset(self):
        board_hash = self.kwargs['board_hash']
        board = get_object_or_404(Board, hash=board_hash)
        return Text.objects.filter(board__id=board.id)

    def pre_save(self, text):
        board_hash = self.kwargs['board_hash']
        board = get_object_or_404(Board, hash=board_hash)
        text.board = board

# Return a json file with a specific Text with their respectly attributes (authorized attributes in TextSerializer)
class TextDetail(generics.RetrieveUpdateDestroyAPIView):
    model = Text
    serializer_class = TextSerializer

# Return a json file with a Line list with their respectly attributes each one (authorized attributes in LineSerializer)
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

# Return a json file with a specific Line with their respectly attributes (authorized attributes in LineSerializer)
class LineDetail(generics.RetrieveUpdateDestroyAPIView):
    model = Line
    serializer_class = LineSerializer

# Return a specific Board
class BoardDetail(generics.RetrieveUpdateDestroyAPIView):
    model = Board
    serializer_class = BoardSerializer
    lookup_field = 'hash'

    def pre_save(self, board):
        pass

    def post_save(self, board, created=False):
        if 'board_'+str(board.id) in self.request.session:
            del self.request.session['board_'+str(board.id)]

class Invite(APIView):
    def post(self, request, hash, format=None):
        board = get_object_or_404(Board, hash=hash)
        identification = request.DATA["username"]
        if validateEmail(identification):
            try:
                user = User.objects.get(email__iexact=identification)
            except User.DoesNotExist:
                invitation = Invitation()
                invitation.email = identification
                invitation.board = board
                invitation.save()
                send_invitation_email(board, None, invitation)
                return Response({"message": "The user "+ identification +" has been invited"})
        else:
            try:
                user = User.objects.get(username__iexact=identification)
            except User.DoesNotExist:
                return Response({"message": "We don't have a user with that name"}, status=400)

        user_profile = user.get_profile()
        user_profile.boardinos.add(board)
        user_profile.save()

        send_invitation_email(board, user)

        return Response({"message": "The user "+ identification +" has been invited"})


class ProfileDetail(generics.RetrieveUpdateAPIView):
    model = UserProfile
    serializer_class = UserProfileSerializer

    def get_object(self):
        if not self.request.user.is_authenticated():
            return None
        profile = get_object_or_404(UserProfile, user=self.request.user)
        return profile