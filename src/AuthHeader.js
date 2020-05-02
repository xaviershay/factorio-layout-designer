// @flow

import React, { useState, useEffect } from "react";
import ReactModal from "react-modal";
import { useModal } from "react-modal-hook";
import * as firebase from "firebase/app";
import "firebase/auth";
import { StyledFirebaseAuth } from "react-firebaseui";

export type User =
  | {
      type: "loading",
    }
  | {
      type: "signed_out",
    }
  | {
      type: "signed_in",
      uid: string,
      email: string,
    };

const USER_LOADING = { type: "loading" };
const USER_SIGNED_OUT = { type: "signed_out" };

const uiConfig = {
  signInFlow: "popup",
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
};

export const useAuthState = () => useState<User>(USER_LOADING);

const AuthHeader = ({
  user,
  setUser,
}: {
  user: User,
  setUser: (User) => void,
}) => {
  const [showLoginModal, hideLoginModal] = useModal(() => (
    <ReactModal
      isOpen
      className="login-modal"
      overlayClassName="login-modal-overlay"
      onRequestClose={hideLoginModal}
    >
      <p>Signing in allows you to save and share your designs.</p>
      <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
    </ReactModal>
  ));

  useEffect(
    () =>
      firebase.auth().onAuthStateChanged((user) => {
        // This will always be called at least once
        if (user == null) {
          setUser(USER_SIGNED_OUT);
        } else {
          setUser({ ...user, type: "signed_in" });
        }

        if (user) {
          hideLoginModal();
        }
      }),
    [hideLoginModal, setUser]
  );

  switch (user.type) {
    case "signed_out":
      return <button onClick={showLoginModal}>Sign in</button>;
    case "signed_in":
      return (
        <div>
          <div style={{ display: "inline" }}>
            {user.email}{" "}
            <button onClick={() => firebase.auth().signOut()}>Sign out</button>
          </div>
        </div>
      );
    default:
      return null;
  }
};

export default AuthHeader;
