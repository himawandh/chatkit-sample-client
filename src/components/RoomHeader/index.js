import React from 'react'
import style from './index.module.css'

export const RoomHeader = ({
  state: { room, user, sidebarOpen, userListOpen, userLogout },
  actions: { setSidebar, setUserList, setUserLogout },
}) => (
  <header className={style.component}>
    <button onClick={e => setSidebar(!sidebarOpen)}>
      <svg>
        <use xlinkHref="index.svg#menu" />
      </svg>
    </button>
    <h1>{room.name && room.name.replace(user.id, '')}</h1>
    {room.users && (
    <div onClick={e => setUserLogout(userLogout)}>Log Out
        <svg>
          <use xlinkHref="index.svg#remove" />
        </svg>
      </div>
    )},
    {room.users && (
      <div onClick={e => setUserList(!userListOpen)}>
        <span>{room.users.length}</span>
        <svg>
          <use xlinkHref="index.svg#members" />
        </svg>
      </div>
    )}
  </header>
)
