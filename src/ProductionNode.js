// @flow

import React from "react";
import {
  DefaultPortModel,
  DefaultLinkModel,
  DefaultNodeModel,
} from "@projectstorm/react-diagrams";
import { AbstractReactFactory } from "@projectstorm/react-canvas-core";
import ProductionNodeWidget from "./ProductionNodeWidget";
import _ from "lodash";

export class ProductionLinkModel extends DefaultLinkModel {
  // There are circular type dependencies here, so need to ignore this lint.
  // eslint-disable-next-line no-use-before-define
  sourcePort: ProductionPortModel;
  // eslint-disable-next-line no-use-before-define
  targetPort: ProductionPortModel;

  setTargetPort(port: ProductionPortModel) {
    super.setTargetPort(port);
    this.matchUpPorts(this.sourcePort, port);
  }

  setSourcePort(port: ProductionPortModel) {
    super.setSourcePort(port);
    this.matchUpPorts(this.sourcePort, port);
  }

  get id(): string {
    return this.options.id;
  }

  get inputPortName(): string {
    if (this.targetPort && this.targetPort.isInput) {
      return this.targetPort.name;
    }

    if (this.sourcePort && this.sourcePort.isInput) {
      return this.sourcePort.name;
    }

    throw new Error("Link is not connected to an input!");
  }

  get outputPortName(): string {
    if (this.targetPort && !this.targetPort.isInput) {
      return this.targetPort.name;
    }

    if (this.sourcePort && !this.sourcePort.isInput) {
      return this.sourcePort.name;
    }

    throw new Error("Link is not connected to an output!");
  }

  matchUpPorts(a: ProductionPortModel, b: ProductionPortModel) {
    if (a && b) {
      if (a.icon) {
        b.icon = a.icon;
      } else if (b.icon) {
        a.icon = b.icon;
      }
    }
  }
}

type ProductionPortOptionsType = {};

export class ProductionPortModel extends DefaultPortModel {
  constructor(options: ProductionPortOptionsType = {}) {
    super({
      ...options,
      type: "production-port",
    });
  }

  canLinkToPort(port: ProductionPortModel) {
    if (super.canLinkToPort(port)) {
      if (this.icon && port.icon) {
        return this.icon === port.icon;
      }
      return true;
    }
  }

  get isInput(): boolean {
    return this.options.in;
  }

  get icon() {
    return this.options.icon;
  }

  set icon(x: string) {
    this.options.icon = x;
  }

  get name(): string {
    return [this.parent.options.name, this.icon].join("-");
  }

  createLinkModel(factory: ProductionLinkModel) {
    console.log("creating link model");
    return new ProductionLinkModel();
  }

  serialize() {
    return {
      ...super.serialize(),
      options: this.options,
    };
  }

  deserialize(ob: any, engine: any) {
    super.deserialize(ob, engine);
    this.options = ob.data.options;
  }
}

export class ProductionNodeFactory extends AbstractReactFactory {
  constructor() {
    super("production-node");
  }

  generateModel(event: ProductionNode) {
    return new ProductionNode();
  }

  generateReactWidget(event: any) {
    return <ProductionNodeWidget engine={this.engine} node={event.model} />;
  }
}

export class ProductionPortFactory extends AbstractReactFactory {
  constructor() {
    super("production-port");
  }

  generateModel(event: ProductionPortModel) {
    return new ProductionPortModel();
  }
}

type ProductionNodeOptionsType = {};

export class ProductionNode extends DefaultNodeModel {
  constructor(options: ProductionNodeOptionsType = {}) {
    super({
      ...options,
      type: "production-node",
    });
  }

  get id() {
    return this.options.id;
  }
  get name() {
    return this.options.name;
  }
  get duration() {
    return this.options.duration;
  }
  get craftingSpeed() {
    return this.options.craftingSpeed;
  }
  get productivityBonus() {
    return this.options.productivityBonus;
  }
  get targetRate() {
    return this.options.targetRate;
  }
  get targetRateUnits() {
    return this.options.targetRateUnits;
  }
  get targetRateInSeconds() {
    if (!this.options.targetRate) {
      return null;
    }

    const multiplier = {
      s: 1,
      m: 1 / 60.0,
      h: 1 / 60.0 / 60.0,
    }[this.targetRateUnits];

    if (!multiplier) {
      throw new Error(`Unknown target rate unit: ${this.targetRateUnits}`);
    }
    return this.targetRate * multiplier;
  }

  get inputPorts() {
    return _.values(this.ports).filter(
      (p: ProductionPortModel) => p.options.in
    );
  }
  get outputPorts() {
    return _.values(this.ports).filter(
      (p: ProductionPortModel) => !p.options.in
    );
  }

  update(values: ProductionNodeOptionsType) {
    this.options = {
      ...this.options,
      ...values,
    };
  }

  addOutput() {
    const portName = "out-" + (this.outputPorts.length + 1);
    this.addPort(
      new ProductionPortModel({
        in: false,
        name: portName,
        icon: null,
        count: 1,
      })
    );
    return portName;
  }

  addInput() {
    const portName = "in-" + (this.inputPorts.length + 1);
    this.addPort(
      new ProductionPortModel({
        in: true,
        name: portName,
        icon: null,
        count: 1,
      })
    );
    return portName;
  }

  get assemblersRequired() {
    const { calculatedRate } = this.options;

    if (!calculatedRate) return null;

    // Copied from Foreman, machines have to wait for a new tick before
    // starting a new item, so round up to nearest tick (assume 60fps). Return
    // fractional assemblers even though not possible in reality in order to
    // help user adjust and tweak.
    return (
      Math.ceil((this.duration / this.craftingSpeed) * calculatedRate * 60) / 60
    );
  }

  set calculatedRate(x: number) {
    this.options.calculatedRate = x;
  }

  serialize() {
    return {
      ...super.serialize(),
      options: this.options,
    };
  }

  deserialize(ob: any, engine: any) {
    super.deserialize(ob, engine);
    this.options = ob.data.options;
  }
}
