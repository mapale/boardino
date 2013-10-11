from django.contrib.auth.models import User
from django.db import models
from userena.models import UserenaBaseProfile
from board.models import Board


class UserProfile(UserenaBaseProfile):
    user = models.OneToOneField(User, unique=True)
    boardinos = models.ManyToManyField(Board)

