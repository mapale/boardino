from django.contrib import admin
from board.models import Board, PostIt

class PostitAdmin(admin.ModelAdmin):
    list_display = ('id', 'text')

admin.site.register(Board)
admin.site.register(PostIt, PostitAdmin)