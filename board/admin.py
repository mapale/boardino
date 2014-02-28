from django.contrib import admin
from board.models import Board, PostIt

# PositAdmin Class
class PostitAdmin(admin.ModelAdmin):
    list_display = ('id', 'text')

# Register and associate Board and PosIt Classes to the Admin Panel
admin.site.register(Board)
admin.site.register(PostIt, PostitAdmin)