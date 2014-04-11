from django import forms
from captcha.fields import CaptchaField

class BoardForm(forms.Form):

    def __init__(self, user, data=None, *args, **kwargs):
        super(BoardForm, self).__init__(data, *args, **kwargs)
        if not user.is_authenticated():
            self.fields['captcha'] = CaptchaField()