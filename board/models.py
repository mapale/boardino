from django.db import models
import hashlib, time

# Board Class
class Board(models.Model):
    # Attributes
    password = models.CharField(default="", blank=True, max_length=20)
    hash = models.CharField(max_length=30, null=True, unique=True,
                            error_messages={'unique':'A Board with this alias already exists'})
    screenshot = models.TextField(blank=True, null= True)
    created = models.DateTimeField(auto_now_add=True, null=True)
    last_visit = models.DateTimeField(blank=True, null=True)

    # Hash generation

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        if not self.hash:
            self.hash = self.generate_hash()
        return super(Board, self).save(force_insert, force_update, using, update_fields)

    # Let generate a hash code that makes references to the properly board's id
    # Use SHA-2
    def generate_hash(self):
        while True:
            hash = hashlib.sha256(str(time.time())).hexdigest()[:8]
            try:
                Board.objects.get(hash=hash)
            except Board.DoesNotExist:
                return hash


    def __unicode__(self):
        if self.hash:
            return self.hash
        return str(self.id)


# PostIt Class
class PostIt(models.Model):
    # Attributes
    board = models.ForeignKey(Board) # Foreign key to Board Model
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    text = models.TextField(null=True, blank=True)
    color = models.TextField(default="#FFFF99")
    back_color = models.TextField(default="#FFFF33")

    def clone(self):
        clone = PostIt()
        clone.x = self.x
        clone.y = self.y
        clone.width = self.width
        clone.height = self.height
        clone.text = self.text
        clone.color = self.color
        clone.back_color = self.back_color
        return clone

    def __unicode__(self):
        return str(self.id)


# Text Class
class Text(models.Model):
    # Attributes
    board = models.ForeignKey(Board) # Foreign key to Board Model
    x = models.IntegerField()
    y = models.IntegerField()
    width = models.IntegerField()
    height = models.IntegerField()
    text = models.TextField(null=True, blank=True)

    def clone(self):
        clone = Text()
        clone.x = self.x
        clone.y = self.y
        clone.width = self.width
        clone.height = self.height
        return clone

# Text Class
class Line(models.Model):
    # Attributes
    board = models.ForeignKey(Board) # Foreign key to Board Model
    color_l = models.TextField(default="000000")
    stroke_w = models.IntegerField()
    path = models.TextField(null=True, blank=True)

    def clone(self):
        clone = Line()
        clone.color_l = self.color_l
        clone.stroke_w = self.stroke_w
        clone.path = self.path
        return clone
