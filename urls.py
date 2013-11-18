from django.conf import settings
from django.conf.urls import patterns, url, include

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()
from django.conf.urls.static import static

urlpatterns = patterns('',
    url(r'^', include('board.urls')),

    url(r'^accounts/signin/', 'userena.views.signin', {'template_name': 'signin.html'}, name="signin"),
    url(r'^accounts/signup/', 'userena.views.signup', {'template_name': 'signup.html', 'success_url': '/'}, name="signup"),
    (r'^accounts/', include('userena.urls')),

    #url(r'^favicon\.ico$', 'django.views.generic.simple.redirect_to', {'url': '/static/images/favicon.ico'}),
    # Examples:
    # url(r'^$', 'whiteboard.views.home', name='home'),
    # url(r'^whiteboard/', include('whiteboard.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
)+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
