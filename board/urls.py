from django.conf.urls import include, patterns, url
from rest_framework.urlpatterns import format_suffix_patterns
from board.views import PostitList, PostitDetail, LineList, LineDetail, BoardDetail, ProfileDetail

# Urls Patterns
urlpatterns = patterns('board.views',
    # Home Url
    url(r'^$', 'home'),
    # New Board Url
    url(r'^new$', 'create_board'),
    # Subscribe Url
    url(r'^subscribe', 'subscribe'),
    
    # API

    # Url to see a specific Board
    url(r'^api/boards/(?P<hash>\w+)/$', BoardDetail.as_view(), name='board-detail'),
    
    # PostIts Urls to a specific Board
    # List of PostIts
    url(r'^api/boards/(?P<board_hash>\w+)/postits/$', PostitList.as_view(), name='postit-list'),
    # Specific PostIt
    url(r'^api/boards/(?P<board_hash>\w+)/postits/(?P<pk>\d+)$', PostitDetail.as_view(), name='postit-detail'),
    
    # Texts Urls to a specific Board
    # List of Text
    url(r'^api/boards/(?P<board_hash>\w+)/texts/$', TextList.as_view(), name='text-list'),
    # Specific Text
    url(r'^api/boards/(?P<board_hash>\w+)/texts/(?P<pk>\d+)$', TextDetail.as_view(), name='text-detail'),
    
    # Lines Urls to a specific Board
    # List of Line
    url(r'^api/boards/(?P<board_hash>\w+)/lines/$', LineList.as_view(), name='line-list'),
    # Specific Line
    url(r'^api/boards/(?P<board_hash>\w+)/lines/(?P<pk>\d+)$', LineDetail.as_view(), name='line-detail'),
    url(r'^api/profile/$', ProfileDetail.as_view(), name='user-profile-detail'),

    url(r'^(?P<board_hash>\w+)$', 'board'),
    url(r'^(?P<board_hash>\w+)/clone/$', 'clone', name="clone-board"),
    url(r'^(?P<board_hash>\w+)/authorize', 'authorize_board', name="board-authorization"),
    url(r'^(?P<board_hash>\w+)/lines/clear', 'clear_lines'),
)

urlpatterns = format_suffix_patterns(urlpatterns, allowed=['json', 'api'])

# Urls setting for API
urlpatterns += patterns('',
    url(r'^api/$', 'board.views.api_root'),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
)
