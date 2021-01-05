from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
from .credentials import CLIENT_ID, CLIENT_SECRET
from requests import post, put, get

BASE_URL = "https://api.spotify.com/v1/me"

def get_user_tokens(session_key):
    user_tokens = SpotifyToken.objects.filter(user=session_key)

    if user_tokens.exists():
        return user_tokens[0]
    return None

def update_or_create_user_tokens(session_key, access_token, 
                                token_type, expires_in, refresh_token):
    tokens = get_user_tokens(session_key)
    # Converts seconds to timestamp from current time until
    # time it expires.
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    # We have tokens associated with user, instead of creating
    # new ones, just update the current. 
    if tokens:
        tokens.access_token = access_token
        tokens.refresh_token = refresh_token
        tokens.expires_in = expires_in
        tokens.token_type = token_type
        tokens.save(update_fields=['access_token', 
                                'refresh_token', 
                                'expires_in', 
                                'token_type'])
    else:
        tokens = SpotifyToken(user=session_key, 
                            access_token=access_token, 
                            expires_in=expires_in, 
                            refresh_token=refresh_token, 
                            token_type=token_type)
        tokens.save()

def is_spotify_authenticated(session_key):
    tokens = get_user_tokens(session_key)

    if tokens:
        # If token did expire, refresh it.
        if tokens.expires_in <= timezone.now():
            refresh_spotify_token(session_key)
        return True
    # User doesn't have a token.
    return False

def refresh_spotify_token(session_key):
    tokens = get_user_tokens(session_key)
    refresh_token = tokens.refresh_token

    # Get new access and refresh token for the api.
    response = post('https://accounts.spotify.com.api/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    refresh_token = response.get('refresh_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')

    update_or_create_user_tokens(session_key, 
                                access_token, 
                                token_type, 
                                expires_in, 
                                refresh_token)

def execute_spotify_api_request(session_key, endpoint, post_req=False, put_req=False):
    print(session_key)
    tokens = get_user_tokens(session_key)
    if not tokens:
        return {"Error": "Token not found"}
    print(tokens)
    headers = {
        'Content-Type': 'application/json', 
        'Authorization': 'Bearer ' + tokens.access_token
        }

    if post_req:
        post(BASE_URL + endpoint, headers=headers)

    if put_req:
        put(BASE_URL + endpoint, headers=headers)

    response = get(BASE_URL + endpoint, {}, headers=headers)

    # If get failed or doing put/post, return will fail.
    try:
        return response.json()
    except:
        return {"Error": "Issue with request"}

