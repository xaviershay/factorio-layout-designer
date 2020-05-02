// @flow

import React, { useState, useEffect } from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import _ from "lodash";
import createEngine, { DiagramModel } from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import {
  ProductionNode,
  ProductionNodeFactory,
  ProductionPortFactory,
} from "./ProductionNode";
import AuthHeader, { type User } from './AuthHeader'
import { ModalProvider } from "react-modal-hook";
import ReactModal from "react-modal";
import DiagramState from "./DiagramState";
import ProductionSolver from "./ProductionSolver";
import { useModal } from "react-modal-hook";
import { StyledFirebaseAuth } from "react-firebaseui";
import * as firebase from "firebase/app";
import FibClient from "./FibClient";
import "firebase/analytics";
import "firebase/storage";
import "firebase/auth";

import { ProductionPortModel, ProductionLinkModel } from "./ProductionNode";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA-WiHZQzT7L8oakrYwdRTxm3csUHHQqKA",
  authDomain: "factorio-layout-designer.firebaseapp.com",
  databaseURL: "https://factorio-layout-designer.firebaseio.com",
  projectId: "factorio-layout-designer",
  storageBucket: "factorio-layout-designer.appspot.com",
  messagingSenderId: "406123075299",
  appId: "1:406123075299:web:c5883d39e9a5c5959497d6",
  measurementId: "G-VDN3RD8RT5",
};
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// Configure FirebaseUI.
const uiConfig = {
  signInFlow: "popup",
  signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
  callbacks: {
    // Avoid redirects after sign-in.
    signInSuccessWithAuthResult: () => false,
  },
};

const fibClient = new FibClient();
window.fibClient = fibClient

const engine = createEngine();
engine.maxNumberPointsPerLink = 0;

// Replace the default states with our own that do a better job handling right
// click.
engine.getStateMachine().pushState(new DiagramState());
engine.getNodeFactories().registerFactory(new ProductionNodeFactory());
engine.getPortFactories().registerFactory(new ProductionPortFactory());

// create a diagram model
const model = new DiagramModel();

const node3 = new ProductionNode({
  name: "Copper Cable",
  duration: 0.5,
  craftingSpeed: 1.25,
  productivityBonus: 0.2,
});
node3.setPosition(300, 50);
node3.addPort(
  new ProductionPortModel({
    in: true,
    name: "in-1",
    icon: "copper-plate",
    count: 1,
  })
);
node3.addPort(
  new ProductionPortModel({
    in: false,
    name: "out-1",
    icon: "copper-cable",
    count: 2,
  })
);

const node4 = new ProductionNode({
  name: "Green Circuit",
  duration: 0.5,
  craftingSpeed: 0.75,
  productivityBonus: 0.0,
});
node4.addPort(
  new ProductionPortModel({
    in: true,
    name: "in-1",
    icon: "copper-cable",
    count: 3,
  })
);
node4.addPort(
  new ProductionPortModel({
    in: true,
    name: "in-2",
    icon: "iron-plate",
    count: 1,
  })
);
node4.addPort(
  new ProductionPortModel({
    in: false,
    name: "out-1",
    icon: "green-circuit",
    count: 1,
  })
);
node4.setPosition(650, 100);

const node5 = new ProductionNode({
  name: "Furnace",
  duration: 2,
  craftingSpeed: 2,
  productivityBonus: 0,
});
node5.setPosition(50, 50);
node5.addPort(
  new ProductionPortModel({
    in: false,
    name: "out-1",
    icon: "copper-plate",
    count: 1,
  })
);

const node6 = new ProductionNode({
  name: "Furnace",
  duration: 2,
  craftingSpeed: 2,
  productivityBonus: 0,
});
node6.setPosition(400, 250);
node6.addPort(
  new ProductionPortModel({
    in: false,
    name: "out-1",
    icon: "iron-plate",
    count: 1,
  })
);

const node7 = new ProductionNode({
  name: null,
  duration: 1,
  craftingSpeed: 1,
  productivityBonus: 0,
  targetRate: 10,
  targetRateUnits: "m",
});
node7.setPosition(900, 100);
node7.addInput();

const link2 = new ProductionLinkModel();
link2.setSourcePort(node3.getPort("out-1"));
link2.setTargetPort(node4.getPort("in-1"));

const link3 = new ProductionLinkModel();
link3.setSourcePort(node5.getPort("out-1"));
link3.setTargetPort(node3.getPort("in-1"));

const link4 = new ProductionLinkModel();
link4.setSourcePort(node6.getPort("out-1"));
link4.setTargetPort(node4.getPort("in-2"));

const link5 = new ProductionLinkModel();
link5.setSourcePort(node4.getPort("out-1"));
link5.setTargetPort(node7.getPort("in-1"));

model.addAll(node3, node4, link2, node5, node6, node7, link3, link4, link5);

// install the model into the engine
engine.setModel(model);

// Estimates, used for centering nodes when dropping from tray.
const nodeWidth = 180;
const nodeHeight = 120;
const SIGNED_OUT = "SIGNED_OUT"

const USER_LOADING = {type: 'loading'}
const USER_SIGNED_OUT = {type: 'signed_out'}

const App = () => {
  // null means we are still loading auth state
  const [user, setUser] = useState<User>(USER_LOADING);

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
          setUser(USER_SIGNED_OUT)
        } else {
          setUser({...user, type: 'signed_in'});
        }

        if (user) {
          hideLoginModal();
        }
      }),
    [hideLoginModal]
  );

  const handleSerialize = async () => {
    if (user.type !== 'signed_in') {
      return;
    }
    const ref = firebase
      .storage()
      .ref()
      .child("layouts")
      .child(user.uid)
      .child("current.json");
    const data = JSON.stringify(engine.getModel().serialize());
    await ref.putString(data);
    console.log("saved");
  };

  const handleLoad = async () => {
    if (user.type !== 'signed_in') {
      return;
    }
    const ref = firebase
      .storage()
      .ref()
      .child("layouts")
      .child(user.uid)
      .child("current.json");
    const url = await ref.getDownloadURL();

    const response = await fetch(url);
    const data = await response.json();

    let newModel = new DiagramModel();
    newModel.deserializeModel(data, engine);
    engine.setModel(newModel);
    console.log("loaded");
  };

  const handleSolve = async () => {
    const model = engine.getModel();
    const nodes = model.getNodes();
    const links = model
      .getLinks()
      .filter((link) => link.sourcePort && link.targetPort);

    let solver = new ProductionSolver();
    nodes.forEach((node) => {
      solver.addNode(node);

      const targetRate = node.targetRateInSeconds;
      if (targetRate > 0) {
        solver.addTarget(node, targetRate / (1 + node.productivityBonus));
      }

      _.values(node.ports).forEach((port: ProductionPortModel) => {
        const links = _.values(port.links);
        if (links.length > 0) {
          solver.addRatio(
            node,
            links,
            port.options.count,
            port.options.in ? "INPUT" : "OUTPUT"
          );

          if (port.options.in) {
            solver.addInputLinks(node, links);
          }
        }
      });
    });

    const solution = await solver.solve();

    if (solution) {
      links.forEach((link) => {
        // Link throughput is the maximum, i.e. the supply solution. The
        // consumer solution may be less than this if the consumer is
        // buffering.
        const v = solver.linkVar(link, "INPUT");
        link.labels.length = 0;
        link.addLabel(Math.round(solution[v.name] * 1000) / 1000 + "/s");
      });

      nodes.forEach((node) => {
        const v = solver.nodeVar(node, "ACTUAL");

        node.calculatedRate = solution[v.name];
      });
      engine.repaintCanvas();
    } else {
      console.log("no solution");
    }
  };

  const handleRecipeSearch = async (e) => {
    const q = e.target.value;

    console.log(q);
    console.log(await fibClient.search(q))
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div className="page-header">
        <div>
          <button onClick={handleSerialize}>Save</button>
          <button onClick={handleLoad}>Load</button>
          <button onClick={handleSolve}>Solve</button>
        </div>
        <AuthHeader user={user} handleSignIn={showLoginModal} />
      </div>
      <div className="body">
        <div className="tray">
          <div className="search">
            <input placeholder="Search" onChange={handleRecipeSearch} />
          </div>
          <div
            className="tray-item production-node"
            draggable={true}
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "storm-diagram-node",
                JSON.stringify({
                  name: "Production Target",
                  type: "target-node",
                })
              );
            }}
          >
            <div className="header">Production Target</div>
          </div>
          <div
            className="tray-item production-node"
            draggable={true}
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "storm-diagram-node",
                JSON.stringify({
                  name: "Assembler 1",
                  type: "assembler-node",
                  craftingSpeed: 0.5,
                })
              );
            }}
          >
            <div className="header">Assembler 1 (Blank)</div>
          </div>
          <div
            className="tray-item production-node"
            draggable={true}
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "storm-diagram-node",
                JSON.stringify({
                  name: "Assembler 2",
                  type: "assembler-node",
                  craftingSpeed: 0.75,
                })
              );
            }}
          >
            <div className="header">Assembler 2 (Blank)</div>
          </div>
          <div
            className="tray-item production-node"
            draggable={true}
            onDragStart={(event) => {
              event.dataTransfer.setData(
                "storm-diagram-node",
                JSON.stringify({
                  name: "Assembler 3",
                  type: "assembler-node",
                  craftingSpeed: 1.25,
                })
              );
            }}
          >
            <div className="header">Assembler 3 (Blank)</div>
          </div>
          {/*
          <div className="tray-item production-node" draggable={true}>
            <div className="header">
              Green Circuit
              <img
                src={imageFor('green-circuit')}
                alt="green-circuit"
                width="20"
                height="20"
              />
            </div>
          </div>
          <div className="tray-item production-node" draggable={true}>
            <div className="header">
              Green Circuit
              <img
                src={imageFor('green-circuit')}
                alt="green-circuit"
                width="20"
                height="20"
              />
            </div>
          </div>
          */}
        </div>
        <div
          className="canvas"
          onDrop={(event) => {
            let data = null;
            try {
              data = JSON.parse(
                event.dataTransfer.getData("storm-diagram-node")
              );
            } catch (e) {
              // Not an event we know how to handle
              return null;
            }
            let node;
            if (data.type === "target-node") {
              node = new ProductionNode({
                name: null,
                duration: 1,
                craftingSpeed: 1,
                productivityBonus: 0,
                targetRate: 10,
                targetRateUnits: "s",
              });
              node.addInput();
            } else {
              node = new ProductionNode({
                name: data.name,
                duration: 1,
                craftingSpeed: data.craftingSpeed || 1,
                productivityBonus: 0,
                targetRate: null,
              });
              node.addInput();
              node.addOutput();
            }
            const point = engine.getRelativeMousePoint(event);
            point.x = point.x - nodeWidth / 2;
            point.y = point.y - nodeHeight / 2;
            node.setPosition(point);
            engine.getModel().addNode(node);
            engine.repaintCanvas();
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
        >
          <CanvasWidget className="diagram-container" engine={engine} />
        </div>
      </div>
    </div>
  );
};

ReactModal.setAppElement("#application");
document.addEventListener("DOMContentLoaded", () => {
  ReactDOM.render(
    <ModalProvider>
      <App />
    </ModalProvider>,
    document.querySelector("#application")
  );
});
