from django.shortcuts import render

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response

from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer
from .models import Room

from django.http import JsonResponse

# Create your views here.
class RoomView(generics.ListCreateAPIView):
    # Objects returned from this view to be rendered out on page.
    queryset = Room.objects.all()
    # Validates and deserializes input and for serializig output.
    serializer_class = RoomSerializer

# Anything that inherits APIView may override
# http request methods.

class GetRoom(APIView):
    serialzer_class = RoomSerializer
    lookup_url_kwarg = 'code'

    def get(self, request, format=None):
        code = request.GET.get(self.lookup_url_kwarg)
        if code != None:
            # Since code is unique, should always get
            # one value back.
            room = Room.objects.filter(code=code)
            if len(room) > 0:
                # Serializes room and converts into python dict.
                data = RoomSerializer(room[0]).data
                # Check if user is host.
                data['is_host'] = self.request.session.session_key == room[0].host
                return Response(data, status=status.HTTP_200_OK)
            # No room.
            return Response({"Room Not Found": "Invalid Room Code"}, status=status.HTTP_404_NOT_FOUND)
        # Wern't given a code.
        return Response({"Bad Request": "Room code not found"}, status=status.HTTP_400_BAD_REQUEST)

class JoinRoom(APIView):
    lookup_url_kwarg = 'code'

    def post(self, request, format=None):
        # Check if current user has an active session with
        # web server. If not, must create a webserver.
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()
        # Get code from post request
        code = request.data.get(self.lookup_url_kwarg)
        if code != None:
            room_result = Room.objects.filter(code=code)
            if len(room_result) > 0:
                room = room_result[0]
                self.request.session["room_code"] = code
                # Correct room code provided.
                return Response({"message": "Room Joined!"}, status=status.HTTP_200_OK)
            # Room code provided but invalid.
            return Response({"Bad Request": "Invalid room code"}, status=status.HTTP_400_BAD_REQUEST)
        # If room code wasn't sent.
        return Response({"Bad Request": "Invalid post data, did not find a code key"}, status=status.HTTP_400_BAD_REQUEST)

# APIView allows us to override http methods.
class CreateRoomView(APIView):
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        print("creating room")
        # Check if current user has an active session with
        # web server. If not, must create a webserver.
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        # Take all the data and serialize it to get a python
        # representation.
        serializer = self.serializer_class(data=request.data)
        # A serializer is valid if it contains all and only
        # the fields requested.
        if serializer.is_valid():
            print("Valid serializer")
            guest_can_pause = serializer.data.get("guest_can_pause")
            votes_to_skip = serializer.data.get("votes_to_skip")
            host = self.request.session.session_key
            # Check if room already exists. If so, do not create
            # a new one, just update the old one. If not, create
            # a new room.
            queryset = Room.objects.filter(host=host)
            if queryset.exists():
                print("Room exists")
                # If exist, query list will always have one room.
                room = queryset[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip
                # Update room and force specific fields to update.
                room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
                http_response = status.HTTP_200_OK
                self.request.session["room_code"] = room.code
            else:
                print("Room doesn't exist")
                room = Room(
                    host=host, 
                    guest_can_pause=guest_can_pause, 
                    votes_to_skip=votes_to_skip
                    )
                room.save()
                http_response = status.HTTP_201_CREATED
                self.request.session["room_code"] = room.code
            # The data field in the room is JSON formated.
            return Response(RoomSerializer(room).data, status=http_response)

        return Response({'Bad Request': 'Invalid data...'}, status=status.HTTP_400_BAD_REQUEST)

class UserInRoom(APIView):
    def get(self, request, format=None):
        # Check if current user has an active session with
        # web server. If not, must create a webserver.
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = {
            "code": self.request.session.get("room_code")
        }
        # Serializes a Python dict.
        return JsonResponse(data, status=status.HTTP_200_OK)

class LeaveRoom(APIView):
    def post(self, request, format=None):
        # Check if user is host of room first. If so
        # delete it.
        if "room_code" in self.request.session:
            code = self.request.session.pop("room_code")
            host_id = self.request.session.session_key
            room_results = Room.objects.filter(host=host_id)
            if len(room_results) > 0:
                room = room_results[0]
                room.delete()

        return Response({"Message": "Success"}, status=status.HTTP_200_OK)

class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer

    def patch(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            guest_can_pause = serializer.data.get("guest_can_pause")
            votes_to_skip = serializer.data.get("votes_to_skip")
            code = serializer.data.get("code")

            queryset = Room.objects.filter(code=code)
            if not queryset.exists():
                return Response({"Message": f"Room {code} not found."}, status=status.HTTP_404_NOT_FOUND)

            room = queryset[0]
            user_id = self.request.session.session_key
            if room.host != user_id:
                return Response({"Message": f"You are not the host of room {code}"}, status=status.HTTP_403_FORBIDDEN)

            room.guest_can_pause = guest_can_pause
            room.votes_to_skip = votes_to_skip
            room.save(update_fields=['guest_can_pause', 'votes_to_skip'])
            return Response(RoomSerializer(room).data, status=status.HTTP_200_OK)

        return Response({"Bad Request": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)