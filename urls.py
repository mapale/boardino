# File 'urls.py'
# Here you can see all the urls associated respectily to their controllers

# Required libraries
from django.conf import settings
from django.conf.urls import patterns, url, include

# Required Admin Libraries
from django.contrib import admin
admin.autodiscover()
from django.conf.urls.static import static

# Urls Patterns
urlpatterns = patterns('',
		# Include all the urls required to Admin Panel
    url(r'^admin/', include(admin.site.urls)),

    # Include all the urls required to Boards
    # Path -> board/urls.py
    url(r'^', include('board.urls')),

    # Urls for authentication and registering
    url(r'^accounts/signin/', 'userena.views.signin', {'template_name': 'signin.html'}, name="signin"),
    url(r'^accounts/signup/', 'userena.views.signup', {'template_name': 'signup.html', 'success_url': '/'}, name="signup"),
    
    # Account's Urls
    (r'^accounts/', include('userena.urls')),

    url(r'^captcha/', include('captcha.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
)+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
