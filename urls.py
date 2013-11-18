from django.conf import settings
from django.conf.urls import patterns, url, include


from django.contrib import admin
admin.autodiscover()
from django.conf.urls.static import static

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),

    url(r'^', include('board.urls')),

    url(r'^accounts/signin/', 'userena.views.signin', {'template_name': 'signin.html'}, name="signin"),
    url(r'^accounts/signup/', 'userena.views.signup', {'template_name': 'signup.html', 'success_url': '/'}, name="signup"),
    (r'^accounts/', include('userena.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
)+ static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
