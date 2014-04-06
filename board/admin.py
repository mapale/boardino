from django.contrib import admin
from board.models import Board, PostIt

# PositAdmin Class
class PostitAdmin(admin.ModelAdmin):
    list_display = ('id', 'text')

class BoardAdmin(admin.ModelAdmin):
    list_display = ('hash', 'created', 'owner', 'is_private')

# Register and associate Board and PosIt Classes to the Admin Panel
admin.site.register(Board, BoardAdmin)
admin.site.register(PostIt, PostitAdmin)