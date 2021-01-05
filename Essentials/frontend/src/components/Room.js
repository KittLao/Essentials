import React, { Component } from "react";
import { Grid, Button, Typography } from "@material-ui/core";
import CreateRoomPage from "./CreateRoomPage";
import MusicPlayer from "./MusicPlayer";

export default class Room extends Component {
    // Props for room is the roomCode.
    constructor(props) {
        super(props);
        this.state = {
            votes_to_skip: 2,
            guest_can_pause: false,
            is_host: false,
            show_settings: false,
            spotify_authenticated: false,
            song: {}
        };
        this.authenticateSpotify = this.authenticateSpotify.bind(this);
        this.getRoomDetails = this.getRoomDetails.bind(this);
        this.getCurrentSong = this.getCurrentSong.bind(this);
        this.leaveButtonPressed = this.leaveButtonPressed.bind(this);
        this.updateShowSettings = this.updateShowSettings.bind(this);
        this.renderSettingsButton = this.renderSettingsButton.bind(this);
        this.renderSettings = this.renderSettings.bind(this);

        this.roomCode = this.props.match.params.roomCode;
        this.getRoomDetails();
    }

    componentDidMount() {
        // Get current song every 1000ms.
        this.interval = setInterval(this.getCurrentSong, 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    authenticateSpotify() {
        fetch('/spotify/is-authenticated')
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                spotify_authenticated: data.status
            });
            // User isn't authenticated. Authenticate
            // them by redirecting them to Spotify's
            // authentication page.
            if(!data.status) {
                fetch('/spotify/get-auth-url')
                .then((response) => response.json())
                .then((data_) => {
                    // Redirect to Spotify authentication page.
                    window.location.replace(data_.url)
                })
            }
        })
    }

    getRoomDetails() {
        return fetch('/api/get-room' + '?code=' + this.roomCode)
            .then((response) => {
                // If the room doesn't exist anymore
                // set roomCode to null and redirect
                // back to homepage.
                if(!response.ok) {
                    this.props.leaveRoomCallback();
                    this.props.history.push("/");
                }
                return response.json()
            })
            .then((data) => {
                this.setState({
                    votes_to_skip: data.votes_to_skip,
                    guest_can_pause: data.guest_can_pause,
                    is_host: data.is_host
                });
                if(this.state.is_host) {
                    this.authenticateSpotify();
                }
            });
    }

    getCurrentSong() {
        fetch('/spotify/current-song')
        .then((response) => {
            if(!response.ok) {
                return {};
            } else {
                return response.json();
            }
        })
        .then((data) => {
            console.log(this.state);
            this.setState({
                song: data
            });
            console.log(this.state);
        })
    }

    leaveButtonPressed() {
        const requestOptions = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
        }
        fetch("/api/leave-room", requestOptions)
        .then((response) => {
            // Reset roomCode when leaving the room.
            this.props.leaveRoomCallback();
            this.props.history.push("/");
        });
    }

    updateShowSettings(value) {
        this.setState({
            show_settings: value
        });
    }

    renderSettings() {
        return (
            <Grid container spacing={1}>
                <Grid item xs={12} align="center">
                    <CreateRoomPage 
                    update={true} 
                    votes_to_skip={this.state.votes_to_skip} 
                    guest_can_pause={this.state.guest_can_pause} 
                    roomCode={this.roomCode}
                    updateCallback={this.getRoomDetails}/>
                </Grid>
                <Grid item xs={12} align="center">
                    <Button 
                    variant="contained" 
                    color="secondary" 
                    onClick={() => this.updateShowSettings(false)}> 
                        Close
                    </Button>
                </Grid>
            </Grid>
        );
    }

    renderSettingsButton() {
        return (
            <Grid item xs={12} align="center">
                <Button 
                variant="contained" 
                color="primary" 
                onClick={() => this.updateShowSettings(true)}> 
                    Settings
                </Button>
            </Grid>
        );
    }

    render() {
        if(this.state.showSettings) {
            return this.renderSettings();
        }
        return (
            <Grid container spacing={1}>
                <Grid item xs={12} align="center">
                    <Typography variant="h4" component="h4">
                        Code: {this.roomCode}
                    </Typography>
                </Grid>

                {/* Only allow hosts to modify room settings. */}
                {this.state.is_host ? this.renderSettingsButton() : null}
                <Grid  item xs={12} align="center">
                    <Typography variant="h6" component="h6">
                            {Object.keys(this.state.song).length === 0 ? null : <MusicPlayer {...this.state.song}/>}
                    </Typography>
                </Grid>
                <Grid item xs={12} align="center">
                    <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={this.leaveButtonPressed}>
                        Leave Room
                    </Button>
                </Grid>
            </Grid>
        );
    }
}
