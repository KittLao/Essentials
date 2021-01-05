# A serializer takes python code and translate
# it into a json response for the 

from rest_framework import serializers
from .models import Room

# Takes a room object and serializes it into something that
# can be returned into a response.
class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        # Object being serialized.
        model = Room
        # Object being serialized must have these fields.
        fields = ('id', 
                'code', 
                'host', 
                'guest_can_pause', 
                'votes_to_skip',
                'created_at'
            )

# Serialize a request and make sure it's valid.
class CreateRoomSerializer(serializers.ModelSerializer):
    class Meta:
        # Object being serialized.
        model = Room
        # Request must have these fields. The frontend doesn't
        # stuff like host, room code, and when room was created
        # so it cannot send those fields. Those fields are stored
        # in a session key.
        fields = (
            'guest_can_pause',
            'votes_to_skip'
        )

class UpdateRoomSerializer(serializers.ModelSerializer):
    # The code field.
    code = serializers.CharField(validators=[])
    class Meta:
        # Object being serialized.
        model = Room
        # Request must have these fields. The frontend doesn't
        # stuff like host, room code, and when room was created
        # so it cannot send those fields. Those fields are stored
        # in a session key.
        fields = (
            'guest_can_pause',
            'votes_to_skip',
            'code'
        )