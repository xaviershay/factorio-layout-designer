// @flow

import React from "react";
import * as firebase from "firebase/app";
import "firebase/auth";

export type User = {
  type: 'loading'
} | {
  type: 'signed_out'
} | {
  type: 'signed_in',
  uid: string,
  email: string,
}

const AuthHeader = ({user, handleSignIn} : {user: User, handleSignIn : () => void}) => {
    switch (user.type) {
        case 'signed_out':
        return <button onClick={handleSignIn}>Sign in</button>
        case 'signed_in':
        return (
            <div>
            <div style={{ display: "inline" }}>
                {user.email}{" "}
                <button onClick={() => firebase.auth().signOut()}>Sign out</button>
            </div>
            </div>
        )
        default: return null;
    }
}

export default AuthHeader