import React, { Component } from "react"

import { TextField, Button, Grid, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";

export default class RoomJoinPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomCode: "",
            error: ""
        };
        this.handleTextFieldChanged = this.handleTextFieldChanged.bind(this);
        this.roomButtonPressed = this.roomButtonPressed.bind(this);
    }

    handleTextFieldChanged(e) {
        this.setState({
            roomCode: e.target.value
        });
    }

    roomButtonPressed() {
        const requestOptions = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                code: this.state.roomCode
            })
        };
        fetch('/api/join-room', requestOptions)
        .then((response) => {

            // If successfully joined room. Redirect
            // to the room. Otherwise, set the error
            // message.
            if(response.ok) {
                this.props.history.push(`/room/${this.state.roomCode}`);
            } else {
                this.setState({
                    error: "Room not found"
                });
            }
        })
        .catch((error) => {
            console.log(error);
        });
    }

    render() {
        return (
            <Grid container spacing={1} alignItems="center">
                <Grid item xs={12} align="center">
                    <Typography variant='h4' component='h4'>
                        Join a Room
                    </Typography>
                </Grid>

                <Grid item xs={12} align="center">
                    <TextField 
                    error={this.state.error} 
                    label="Code" 
                    placeholer="Enter a Room Code" 
                    value={this.state.roomCode} 
                    helperText={this.state.error} 
                    variant="outlined"
                    onChange={this.handleTextFieldChanged} />
                </Grid>

                <Grid item xs={12} align="center">
                    <Button 
                    variant="contained" 
                    color="primary" 
                    component={Link}
                    onClick={this.roomButtonPressed}>
                        Enter Room
                    </Button>
                </Grid>

                <Grid item xs={12} align="center">
                    <Button 
                    variant="contained" 
                    color="secondary" 
                    to="/" 
                    component={Link}>
                        Back
                    </Button>
                </Grid>
            </Grid>
        );
    }
}