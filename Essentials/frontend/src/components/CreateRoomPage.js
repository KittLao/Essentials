import React, { Component } from "react";

import { Link, Redirect } from "react-router-dom"

import { Button, Grid, Typography, 
        TextField, FormHelperText, FormControl, 
        Radio, RadioGroup, FormControlLabel, 
        Collapse
    } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

export default class CreateRoomPage extends Component {
    static defaultProps = {
        votes_to_skip: 2,
        guest_can_pause: true,
        update: false,
        roomCode: null,
        updateCallback: () => {}
    }

    constructor(props) {
        super(props);
        this.state = {
            guest_can_pause: this.props.guest_can_pause,
            votes_to_skip: this.props.votes_to_skip,
            errorMsg: "",
            successMsg: ""
        };
        // Binds method to class so that inside the actual method
        // there is access to the "this" keyword
        this.handleRoomButtonPressed = this.handleRoomButtonPressed.bind(this);
        this.handleVotesChanged = this.handleVotesChanged.bind(this);
        this.handleGuestCanPauseChange = this.handleGuestCanPauseChange.bind(this);
        this.handleUpdateButtonPressed = this.handleUpdateButtonPressed.bind(this);
    }

    /* All event handler functions takes in an event, 
    and the actual value being changed is in e.target. */

    handleVotesChanged(e) {
        this.setState({
            votes_to_skip: parseInt(e.target.value)
        });
    }

    handleGuestCanPauseChange(e) {
        this.setState({
            guest_can_pause: e.target.value === "true" ? true : false
        });
    }

    handleRoomButtonPressed() {
        // The payload.
        const requestObject = JSON.stringify({
            votes_to_skip: this.state.votes_to_skip,
            guest_can_pause: this.state.guest_can_pause
        });
        const requestOptions = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: requestObject
        };

        // Send request to backend API. Once we get
        // a response, convert it to JSON, and
        // redirect webpage to the create room page.
        fetch("/api/create-room", requestOptions)
        .then((response) => response.json())
        .then((data) => this.props.history.push('/room/' + data.code));
    }

    handleUpdateButtonPressed() {
        // The payload.
        const requestObject = JSON.stringify({
            votes_to_skip: this.state.votes_to_skip,
            guest_can_pause: this.state.guest_can_pause,
            code: this.props.roomCode
        });
        const requestOptions = {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: requestObject
        };

        // Send request to backend API. Once we get
        // a response, convert it to JSON, and
        // redirect webpage to the create room page.
        fetch("/api/update-room", requestOptions)
        .then((response) => {
            if(response.ok) {
                this.setState({
                    successMsg: "Room updated successfully."
                });
            } else {
                this.setState({
                    errorMsg: "Error updating room."
                });
            }
            this.props.updateCallback();
        });
    }

    renderCreateButtons() {
        return (
            <Grid container spacing={1}>
                {/* Create room button. */}
                <Grid item xs={12} align="center">
                    <Button 
                    color="primary" 
                    variant="contained" 
                    onClick={this.handleRoomButtonPressed}>
                        Create a Room
                    </Button>
                </Grid>

                {/* Going back. */}
                <Grid item xs={12} align="center">
                    {/* Button acts as a link, will redirect page. */}
                    <Button 
                    color="secondary" 
                    variant="contained" 
                    to="/" 
                    component={Link}>
                        Back
                    </Button>
                </Grid>
            </Grid>
        );
    }

    renderUpdateButtons() {
        return (
            <Grid item xs={12} align="center">
                <Button 
                color="primary" 
                variant="contained" 
                onClick={this.handleUpdateButtonPressed}>
                    Update Room
                </Button>
            </Grid>
        );
    }

    render() {
        const title = this.props.update ? "Update Room" : "Create a Room";

        return (
            <Grid container spacing={1}>
                <Grid item xs={12} align="center">
                    <Collapse in={this.state.errorMsg != "" || this.state.successMsg != ""}>
                        {
                            this.state.successMsg != "" ? 
                                (
                                    <Alert severity="success" 
                                    onClose={() => {this.setState({successMsg: ""})}}>
                                        {this.state.successMsg}
                                    </Alert>
                                ) :
                                (
                                    <Alert severity="error" 
                                    onClose={() => {this.setState({errorMsg: ""})}}>
                                        {this.state.errorMsg}
                                    </Alert>
                                )
                        }
                    </Collapse>
                </Grid>

                {/* Title */}
                <Grid item xs={12} align="center">
                    <Typography component='h4' variant='h4'>
                        {title}
                    </Typography>
                </Grid>

                {/* Subtitle and buttons for toggling play/pause or control. */}
                <Grid item xs={12} align="center">
                    <FormControl component="fieldset">
                        {/* Subtitle */}
                        <FormHelperText>
                            <div align="center"> 
                                Guest Control of a Playback State
                            </div>
                        </FormHelperText>

                        {/* Radio buttons */}
                        <RadioGroup 
                        row defaultValue={this.props.guest_can_pause.toString()}
                        onChange={this.handleGuestCanPauseChange}>

                            <FormControlLabel 
                            value="true" 
                            control={<Radio color="primary"/>}
                            label="Play/Pause"
                            labelPlacement="bottom" />

                            <FormControlLabel 
                            value="false" 
                            control={<Radio color="secondary"/>}
                            label="No Control"
                            labelPlacement="bottom" />

                        </RadioGroup>

                    </FormControl>
                </Grid>

                {/* Text field for controlling amount of votes to skip. */}
                <Grid item xs={12} align="center">
                    <FormControl>
                        <TextField 
                        required={true} 
                        type="number" 
                        defaultValue={this.state.votes_to_skip}
                        inputProps={{
                            min: 1,
                            style: {textAlign: "center"}
                        }}
                        onChange={this.handleVotesChanged}/>

                        <FormHelperText>
                            <div align="center"> Votes required to skip song </div>
                        </FormHelperText>
                    </FormControl>
                </Grid>
                {this.props.update ? this.renderUpdateButtons() : this.renderCreateButtons()}
            </Grid>
        );
    }
}