from settings import *

#Disable South to avoid migrations when creating test database
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'south']

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:'
    }
}
