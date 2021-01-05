import React, { Component } from "react"

import RoomJoinPage from "./RoomJoinPage";
import CreateRoomPage from "./CreateRoomPage";
import Room from "./Room";

import { 
        BrowserRouter as Router, 
        Switch, 
        Route, 
        Link, 
        Redirect
    } from "react-router-dom";

import { Grid, Button, ButtonGroup, Typography } from "@material-ui/core";

export default class Homepage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            roomCode: null
        };
        this.clearRoomCode = this.clearRoomCode.bind(this);
    }

    /* Homepage needs to fetch data to see if
    room exists. */
    async componentDidMount() {
        fetch("/api/user-in-room")
        .then((response) => response.json())
        .then((data) => {
            this.setState({
                roomCode: data.code
            });
        })
    }

    clearRoomCode() {
        this.setState({
            roomCode: null
        });
    }

    renderHomePage() {
        return (
            <Grid container spacing={3}>
                <Grid item xs={12} align="center">
                    <Typography variant="h3" compact="h3">
                        House Party
                    </Typography>
                </Grid>
                <Grid item xs={12} align="center">
                    <ButtonGroup 
                    disableElevation 
                    variant="contained" 
                    color="primary">
                        <Button color="primary" to="/join" component={Link}>
                            Join a Room
                        </Button>
                        <Button color="secondary" to="/create" component={Link}>
                            Create a Room
                        </Button>
                    </ButtonGroup>
                </Grid>
            </Grid>
        );
    }

    render() {
        return (
            <Router>
                <Switch>
                    {/* If we see a path that contains this subpath, 
                    then go to this page.  */}
                    <Route exact path="/" render={() => {
                        return (
                            this.state.roomCode ? 
                            <Redirect to={`/room/${this.state.roomCode}`} /> : 
                            this.renderHomePage()
                        );
                    }} />
                    {/* Webpage for joining and creating rooms */}
                    <Route path="/join" component={RoomJoinPage} />
                    <Route path="/create" component={CreateRoomPage} />
                    {/* When entering a room from the homepage, 
                    pass the homepage's props and a call back
                    function to the room so it can modify attributes
                    declared in the homepage. */}
                    <Route 
                    path="/room/:roomCode" 
                    render={(props) => {
                        return <Room {...props} leaveRoomCallback={this.clearRoomCode} />
                    }}/>
                </Switch>
            </Router>
        )
    }
}