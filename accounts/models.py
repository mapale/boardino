from django.contrib.auth.models import User
from django.db import models
from userena.models import UserenaBaseProfile
from board.models import Board

# UserProfile Class
class UserProfile(UserenaBaseProfile):
    user = models.OneToOneField(User, unique=True)
    boardinos = models.ManyToManyField(Board)
    is_premium = models.BooleanField(default=False)


class Invitation(models.Model):
    email = models.EmailField()
    board = models.ForeignKey(Board)
