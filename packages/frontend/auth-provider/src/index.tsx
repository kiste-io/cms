import React, { useContext, createContext, useState } from 'react';

// read!!!!! https://kentcdodds.com/blog/using-fetch-with-type-script
export const fetchLogin = (TOKEN_ENDPOINT, {username, password}) => new Promise(async (resolve, reject) => {
 
    try {
      const response = await fetch(TOKEN_ENDPOINT, {
          method: `POST`,
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `username=${username}&password=${password}&grant_type=password&client_id=app`
      })
      response.status === 200 
        ? resolve(await response.json())
        : reject(await response.json())
    } catch (e) {
      reject(e)
    }
    
})


export const fetchRefreshToken = (TOKEN_ENDPOINT, refresh_token) => new Promise(async (resolve, reject) => {
 
  const response = await fetch(TOKEN_ENDPOINT, {
      method: `POST`,
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `refresh_token=${refresh_token}&grant_type=refresh_token&client_id=app`
  })

  response.status === 200 
      ? resolve(await response.json())
      : reject(await response.json())

})


const authContext = createContext();

const authFlag = {
  isAuthenticated: false,
  signin(cb) {
    authFlag.isAuthenticated = true;
    cb()
  },
  signout(cb) {
    authFlag.isAuthenticated = false;
    cb()
  }
};

function useProvideAuth() {
  const [user, setUser] = useState(null);

  const signin = (payload, cb) => {
    return authFlag.signin(() => {
      setUser(payload);
      cb();
    });
  };

  const signout = cb => {
    return authFlag.signout(() => {
      setUser(null);
      cb();
    });
  };

  return {
    user,
    signin,
    signout
  };
}


export const ProvideAuth = ({ children }) => {
  const auth = useProvideAuth();
  return (
    <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(authContext);
}
