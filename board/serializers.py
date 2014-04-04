from rest_framework import serializers
from board.models import PostIt, Line, Board, Text
from accounts.models import UserProfile
from django.contrib.auth.models import User


# Serializers
# Return information from each model, to be consumed by API

# PostIt Serializer
# Return: id, x, y, with, height, text and back_color
class PostitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostIt
        fields = ['id','x','y','width','height','text','back_color']


# Text Serializer
# Return: id, x, y, witdh, height and text
class TextSerializer(serializers.ModelSerializer):
    class Meta:
        model = Text
        fields = ['id','x','y','width','height', 'text']


# Line Serializer
# Return: id, color_l, stroke_w and path
class LineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Line
        fields = ['id', 'color_l','stroke_w','path']


# Board Serializer
# Return: has and password
class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ['hash','password', 'screenshot']

    def to_native(self, obj):
        ret = super(BoardSerializer, self).to_native(obj)
        del ret['password']
        return ret

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()

    class Meta:
        model = UserProfile 