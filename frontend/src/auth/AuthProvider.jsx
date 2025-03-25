import React from 'react'

const AuthProvider = ({children}) => {
  if(localStorage.getItem('docbot_token'))
  return (
    <>{children}</>
  )

  return <>Please login.....</>
}

export default AuthProvider