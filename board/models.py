from django.db import models
import hashlib, time

class Board(models.Model):

    password = models.TextField(default="", blank=True)
    hash = models.CharField(max_length=30, null=True)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        if not self.hash:
            self.hash = self.generate_hash()
        return super(Board, self).save(force_insert, force_update, using, update_fields)

    def generate_hash(self):
        while True:
            hash = hashlib.sha256(str(time.time())).hexdigest()[:8]
            try:
                Board.objects.get(hash=hash)
            except Board.DoesNotExist:
                return hash


    def __unicode__(self):
        return self.id

class PostIt(models.Model):
    board = models.ForeignKey(Board)
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    text = models.TextField(null=True, blank=True)
    color = models.TextField(default="#FFFF99")
    back_color = models.TextField(default="#FFFF33")

class Line(models.Model):
    board = models.ForeignKey(Board)
    color_l = models.TextField(default="000000")
    stroke_w = models.IntegerField()
    path = models.TextField(null=True, blank=True)

