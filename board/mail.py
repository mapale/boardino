from django_mandrill.mail import MandrillTemplateMail

def send_invitation_email(board, user, invitation=None):
    if (user):
        email = user.email
        name = user.get_full_name()
    else:
        email = invitation.email
        name = ""

    message = {
        'from_email': 'info@boardino.com',
        'from_name': 'Boardino',
        'subject': 'Board Invitation',
        'to': [{'email': email, 'name': name},],
        'global_merge_vars': [],
        'merge_vars': [
            {
                "rcpt": email,
                "vars": [
                    {
                        "name": "board_url",
                        "content": "http://boardino.com/" + board.hash
                    }
                ]
            }
        ]
    }

    mail = MandrillTemplateMail("invitation", [], message)
    mail.send()