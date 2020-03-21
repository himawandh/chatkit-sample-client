import React from 'react'
import ReactDOM from 'react-dom'
import { set, del, push } from 'object-path-immutable'
import './index.css'

import { UserHeader } from './components/UserHeader'
import { UserList } from './components/UserList'
import { MessageList } from './components/MessageList'
import { TypingIndicator } from './components/TypingIndicator'
import { CreateMessageForm } from './components/CreateMessageForm'
import { RoomList } from './components/RoomList'
import { RoomHeader } from './components/RoomHeader'
import { CreateRoomForm } from './components/CreateRoomForm'
import { WelcomeScreen } from './components/WelcomeScreen'
import { JoinRoomScreen } from './components/JoinRoomScreen'
import { Router, Route, Link } from "react-router-dom";
import createBrowserHistory from "history/createBrowserHistory";


import ChatManager from './chatkit'

import Auth from './auth/auth'

// --------------------------------------
// Application
// --------------------------------------

class Chat extends React.Component {
  render(){
    return <Main {...this.props}/>
  }
}

class Loading extends React.Component {
  //While login is happening
  render() {
    this.props.auth.handleAuthentication(this.props.authCallback)
    return <h1>Loading...</h1>
  }
}

class Authorizer extends React.Component {
  render(){
    this.props.auth.login()
    return <h1>Authorizing...</h1>
  }
  
}

class App extends React.Component {

  constructor(){
    super()
    this.auth = new Auth()
    this.authCallback = this.authCallback.bind(this)
    this.hasHashToken = this.hasHashToken.bind(this)
  }

  hasHashToken({location}) { return /access_token|id_token|error/.test(location.hash)}

  authCallback(authState) {
    this.setState(authState)
  }

  render() {

    if(this.props.auth.isAuthenticated()) return(<Chat userId = {this.auth.getUserId()}/>)

    if(this.hasHashToken(this.props)){
      return(
        <Loading  
          auth = {this.props.auth}
          authCallback = {this.authCallback} 
        />)
    }
    return(
      <Authorizer 
        auth = {this.props.auth} 
        authCallback = {this.authCallback} 
      />)
  }
}

class Main extends React.Component {
  state = {
    user: {},
    room: {},
    messages: {},
    typing: {},
    sidebarOpen: false,
    userListOpen: window.innerWidth > 1000,
  }

  actions = {
    // --------------------------------------
    // UI
    // --------------------------------------

    setSidebar: sidebarOpen => this.setState({ sidebarOpen }),
    setUserList: userListOpen => this.setState({ userListOpen }),

    // --------------------------------------
    // User
    // --------------------------------------

    setUser: user => this.setState({ user }),

    // --------------------------------------
    // Room
    // --------------------------------------

    setRoom: room => {
      this.setState({ room, sidebarOpen: false })
      this.actions.scrollToEnd()
    },

    removeRoom: room => this.setState({ room: {} }),

    joinRoom: room => {
      this.actions.setRoom(room)
      this.actions.subscribeToRoom(room)

      let messagesInRoom = this.state.messages[room.id]
      let lastMessage = messagesInRoom[messagesInRoom.length - 1]

      this.state.messages[room.id] &&
        this.actions.setCursor(
          room.id,
          lastMessage.id
        )
    },

    subscribeToRoom: room =>
      !this.state.user.roomSubscriptions[room.id] &&
      this.state.user.subscribeToRoom({
        roomId: room.id,
        hooks: { onMessage: this.actions.addMessage },
      }),

    createRoom: options =>
      this.state.user.createRoom(options).then(this.actions.joinRoom),

    createConvo: options => {
      if (options.user.id !== this.state.user.id) {
        const exists = this.state.user.rooms.find(
          x =>
            x.name === options.user.id + this.state.user.id ||
            x.name === this.state.user.id + options.user.id
        )
        console.log(`Exists: ${exists}`)
        if(exists){
          console.log("Room exists - will join")
          this.actions.joinRoom(exists)

        }
        else {
          console.log("Room doesn't exist - will create")
          this.actions.createRoom({
            name: this.state.user.id + options.user.id,
            addUserIds: [options.user.id],
            private: true,
          })

        }
        // exists
        //   ? {
        //   }
        //   : this.actions.createRoom({
        //       name: this.state.user.id + options.user.id,
        //       addUserIds: [options.user.id],
        //       private: true,
        //     })
      }
    },

    addUserToRoom: ({ userId, roomId = this.state.room.id }) =>
      this.state.user
        .addUserToRoom({ userId, roomId })
        .then(this.actions.setRoom),

    removeUserFromRoom: ({ userId, roomId = this.state.room.id }) =>
      userId === this.state.user.id
        ? this.state.user.leaveRoom({ roomId })
        : this.state.user
            .removeUserFromRoom({ userId, roomId })
            .then(this.actions.setRoom),

    // --------------------------------------
    // Cursors
    // --------------------------------------

    setCursor: (roomId, position) =>
      this.state.user
        .setReadCursor({ roomId, position: parseInt(position) })
        .then(x => this.forceUpdate()),

    // --------------------------------------
    // Messages
    // --------------------------------------


    addMessage: payload => {
      const roomId = payload.room.id
      const messageId = payload.id

      if(!this.state.messages.roomId) this.setState(this.state.messages.roomId = [])

      // Update local message cache with new message
      this.setState(push(this.state, ['messages', roomId], payload))
      
      // Update cursor if the message was read
      if (roomId === this.state.room.id) {
        const cursor = this.state.user.readCursor({ roomId }) || {}
        const cursorPosition = cursor.position || 0
        cursorPosition < messageId && this.actions.setCursor(roomId, messageId)
        this.actions.scrollToEnd()
      }
      // Send notification
      this.actions.showNotification(payload)
    },

    runCommand: command => {
      const commands = {
        invite: ([userId]) => this.actions.addUserToRoom({ userId }),
        remove: ([userId]) => this.actions.removeUserFromRoom({ userId }),
        leave: ([userId]) =>
          this.actions.removeUserFromRoom({ userId: this.state.user.id }),
      }
      const name = command.split(' ')[0]
      const args = command.split(' ').slice(1)
      const exec = commands[name]
      exec && exec(args).catch(console.log)
    },

    scrollToEnd: e =>
      setTimeout(() => {
        const elem = document.querySelector('#messages')
        elem && (elem.scrollTop = 100000)
      }, 0),

    // --------------------------------------
    // Typing Indicators
    // --------------------------------------

    isTyping: (room, user) =>
      this.setState(set(this.state, ['typing', room.id, user.id], true)),

    notTyping: (room, user) =>
      this.setState(del(this.state, ['typing', room.id, user.id])),

    // --------------------------------------
    // Presence
    // --------------------------------------

    setUserPresence: () => this.forceUpdate(),

    // --------------------------------------
    // Notifications
    // --------------------------------------

    showNotification: message => {
      if (
        'Notification' in window &&
        this.state.user.id &&
        this.state.user.id !== message.senderId &&
        document.visibilityState === 'hidden'
      ) {
        const notification = new Notification(
          `New Message from ${message.sender.id}`,
          {
            body: message.text,
            icon: message.sender.avatarURL,
          }
        )
        notification.addEventListener('click', e => {
          this.actions.joinRoom(message.room)
          window.focus()
        })
      }
    },
  }

  componentDidMount() {
      'Notification' in window && Notification.requestPermission()
    
      let existingUser = { 
        id: this.props.userId, 
        accessToken: localStorage.getItem('access_token') 
      }

      ChatManager(this, existingUser)
  }

  render() {
    const {
      user,
      room,
      messages,
      typing,
      sidebarOpen,
      userListOpen,
    } = this.state
    const { createRoom, createConvo, removeUserFromRoom } = this.actions
    return (
      <main>
        <aside data-open={sidebarOpen}>
          <UserHeader user={user} />
          <RoomList
            user={user}
            rooms={user.rooms}
            messages={messages}
            typing={typing}
            current={room}
            actions={this.actions}
          />
          {user.id && <CreateRoomForm submit={createRoom} />}
        </aside>
        <section>
          <RoomHeader state={this.state} actions={this.actions} />
          {room.id ? (
            <row->
              <col->
                <MessageList
                  user={user}
                  messages={messages[room.id]}
                  createConvo={createConvo}
                />
                <TypingIndicator typing={typing[room.id]} />
                <CreateMessageForm state={this.state} actions={this.actions} />
              </col->
              {userListOpen && (
                <UserList
                  room={room}
                  current={user.id}
                  createConvo={createConvo}
                  removeUser={removeUserFromRoom}
                />
              )}
            </row->
          ) : user.id ? (
            <JoinRoomScreen />
          ) : (
            <WelcomeScreen />
          )}
        </section>
      </main>
    )
  }
}

// --------------------------------------
// Authentication
// --------------------------------------

const auth = new Auth()

ReactDOM.render(
    <Router history={createBrowserHistory()} >
      <Route path="/" render={(props) => <App auth={auth} {...props} />} />
    </Router>,
  document.getElementById('root')
);
