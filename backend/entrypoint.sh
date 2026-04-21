#!/bin/sh

python manage.py migrate
python manage.py createsuperuser --noinput
exec gunicorn --bind 0.0.0.0:8000 --workers 17 backend.wsgi:application