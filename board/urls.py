from django.conf.urls import include
from django.conf.urls.defaults import patterns, url
from rest_framework.urlpatterns import format_suffix_patterns
from board.views import PostitList, PostitDetail, LineList, LineDetail, BoardDetail, ProfileDetail

urlpatterns = patterns('board.views',
    url(r'^$', 'home'),
    url(r'^new$', 'create_board'),
    url(r'^subscribe', 'subscribe'),
    #API
    url(r'^api/boards/(?P<hash>\w+)/$', BoardDetail.as_view(), name='board-detail'),
    url(r'^api/boards/(?P<board_hash>\w+)/postits/$', PostitList.as_view(), name='postit-list'),
    url(r'^api/boards/(?P<board_hash>\w+)/postits/(?P<pk>\d+)$', PostitDetail.as_view(), name='postit-detail'),
    url(r'^api/boards/(?P<board_hash>\w+)/lines/$', LineList.as_view(), name='line-list'),
    url(r'^api/boards/(?P<board_hash>\w+)/lines/(?P<pk>\d+)$', LineDetail.as_view(), name='line-detail'),
    url(r'^api/profile/$', ProfileDetail.as_view(), name='user-profile-detail'),

    url(r'^(?P<board_hash>\w+)$', 'board'),
    url(r'^(?P<board_hash>\w+)/clone/$', 'clone', name="clone-board"),
    url(r'^(?P<board_hash>\w+)/authorize', 'authorize_board', name="board-authorization"),
    url(r'^(?P<board_hash>\w+)/lines/clear', 'clear_lines'),
)

urlpatterns = format_suffix_patterns(urlpatterns, allowed=['json', 'api'])


urlpatterns += patterns('',
    url(r'^api/$', 'board.views.api_root'),
    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
)
