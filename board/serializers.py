from rest_framework import serializers
from board.models import PostIt, Line, Board
from accounts.models import UserProfile
from django.contrib.auth.models import User


class PostitSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostIt
        fields = ['id','x','y','width','height','text','back_color']


class LineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Line
        fields = ['id', 'color_l','stroke_w','path']


class BoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Board
        fields = ['hash','password']

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