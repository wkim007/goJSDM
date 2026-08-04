import React, { useEffect, useRef, useState } from "react";
import go from "gojs";
import { initialModel, paletteItems } from "./sampleData";

const GOJS_LICENSE_KEY = import.meta.env.VITE_GOJS_LICENSE_KEY;

if (GOJS_LICENSE_KEY) {
  go.Diagram.licenseKey = GOJS_LICENSE_KEY;
}

const emptySelection = {
  key: "",
  name: "",
  color: "#2563eb",
  fields: []
};

function normalizeSelectionData(data) {
  return {
    key: data?.key || "",
    name: data?.name || data?.text || "",
    color: data?.color || "#94a3b8",
    fields: Array.isArray(data?.fields) ? data.fields : []
  };
}

const LEFT_RAIL_DEFAULT = 280;
const RIGHT_RAIL_DEFAULT = 360;
const LEFT_RAIL_MIN = 220;
const LEFT_RAIL_MAX = 520;
const RIGHT_RAIL_MIN = 260;
const RIGHT_RAIL_MAX = 560;

const DIAGRAM_BOX_ITEMS = [
  { id: "entity", label: "Entity", tooltip: "Add Entity", icon: "entity" },
  { id: "annotation", label: "Annotation", tooltip: "Add Annotation", icon: "annotation" },
  { id: "view", label: "View", tooltip: "Add View", icon: "view" },
  { id: "identifying", label: "Identifying", tooltip: "Add Identifying Relation", icon: "identifying" },
  { id: "non-identifying", label: "Non-Identifying", tooltip: "Add Non-Identifying Relation", icon: "nonIdentifying" },
  { id: "materialized", label: "View/Materialized Rel.", tooltip: "Add View or Materialized Relation", icon: "materialized" }
];

const DRAWING_BOX_ITEMS = [{ id: "drawing", label: "Drawing", tooltip: "Add Drawing", icon: "drawing" }];
const DRAWING_SHAPE_ITEMS = [
  { id: "rectangle", label: "Rectangle" },
  { id: "round-rectangle", label: "Round Rectangle" },
  { id: "ellipse", label: "Ellipse" },
  { id: "diamond", label: "Diamond" },
  { id: "hexagon", label: "Hexagon" },
  { id: "octagon", label: "Octagon" },
  { id: "parallelogram", label: "Parallelogram" },
  { id: "pentagon", label: "Pentagon" },
  { id: "star", label: "Star" },
  { id: "cross", label: "Cross" },
  { id: "triangle-up", label: "Triangle Up" },
  { id: "triangle-down", label: "Triangle Down" },
  { id: "triangle-left", label: "Triangle Left" },
  { id: "triangle-right", label: "Triangle Right" },
  { id: "connector", label: "Connector" }
];

const DRAWING_FIGURE_MAP = {
  rectangle: { figure: "Rectangle", size: [160, 96] },
  "round-rectangle": { figure: "RoundedRectangle", size: [160, 96], corner: 18 },
  ellipse: { figure: "Ellipse", size: [160, 96] },
  diamond: { figure: "Diamond", size: [150, 110] },
  hexagon: { geometry: "F M20 0 L80 0 100 50 80 100 20 100 0 50z", size: [162, 104] },
  octagon: { geometry: "F M30 0 L70 0 100 30 100 70 70 100 30 100 0 70 0 30z", size: [158, 104] },
  parallelogram: { geometry: "F M22 0 L100 0 78 100 0 100z", size: [166, 98] },
  pentagon: { geometry: "F M50 0 L100 38 82 100 18 100 0 38z", size: [154, 112] },
  star: { geometry: "F M50 0 L61 35 98 35 68 57 79 91 50 70 21 91 32 57 2 35 39 35z", size: [164, 126] },
  cross: { geometry: "F M38 0 L62 0 62 38 100 38 100 62 62 62 62 100 38 100 38 62 0 62 0 38 38 38z", size: [136, 136] },
  "triangle-up": { figure: "TriangleUp", size: [150, 118] },
  "triangle-down": { figure: "TriangleDown", size: [150, 118] },
  "triangle-left": { figure: "TriangleLeft", size: [150, 118] },
  "triangle-right": { figure: "TriangleRight", size: [150, 118] },
  connector: { geometry: "M0 50 L100 50", size: [180, 28], lineOnly: true }
};

function cloneModel(source = initialModel) {
  return {
    nodeDataArray: structuredClone(source.nodeDataArray),
    linkDataArray: structuredClone(source.linkDataArray)
  };
}

function fieldBadges(field) {
  return [field.pk && "PK", field.fk && "FK", field.unique && "UQ", field.nullable ? "NULL" : "REQ"].filter(Boolean);
}

function createGraphLinksModel(source) {
  const graphModel = new go.GraphLinksModel(
    structuredClone(source.nodeDataArray ?? []),
    structuredClone(source.linkDataArray ?? [])
  );
  graphModel.linkKeyProperty = "key";
  graphModel.copiesArrays = true;
  graphModel.copiesArrayObjects = true;
  return graphModel;
}

function getDrawingFigureConfig(shapeId) {
  return DRAWING_FIGURE_MAP[shapeId] ?? DRAWING_FIGURE_MAP.rectangle;
}

function ToolGlyph({ icon }) {
  const shared = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };

  switch (icon) {
    case "entity":
      return (
        <svg {...shared}>
          <rect x="4" y="4" width="6" height="6" rx="1.2" />
          <rect x="14" y="4" width="6" height="6" rx="1.2" />
          <rect x="4" y="14" width="6" height="6" rx="1.2" />
          <rect x="14" y="14" width="6" height="6" rx="1.2" />
        </svg>
      );
    case "annotation":
      return (
        <svg {...shared}>
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
          <rect x="4" y="4" width="16" height="16" rx="3" />
        </svg>
      );
    case "view":
      return (
        <svg {...shared}>
          <rect x="3.5" y="5" width="17" height="4" rx="1.5" />
          <rect x="3.5" y="10.5" width="7" height="8.5" rx="1.5" />
          <rect x="13.5" y="10.5" width="7" height="3.5" rx="1.5" />
          <rect x="13.5" y="15.5" width="7" height="3.5" rx="1.5" />
        </svg>
      );
    case "identifying":
      return (
        <svg {...shared}>
          <path d="M7 7l10 10" />
          <path d="M9 17h8v-8" />
          <path d="M7 17l-2-2" />
          <path d="M17 7l2 2" />
        </svg>
      );
    case "nonIdentifying":
      return (
        <svg {...shared}>
          <path d="M6 12h12" />
          <path d="M15 9l3 3-3 3" />
          <path d="M6 9h3" />
          <path d="M6 15h3" />
        </svg>
      );
    case "materialized":
      return (
        <svg {...shared}>
          <circle cx="7" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="17" cy="12" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      );
    case "drawing":
      return (
        <svg {...shared}>
          <path d="M8 6h8l2 2v8l-2 2H8l-2-2V8l2-2z" />
          <path d="M10 9l4 6" />
          <path d="M14 9l-4 6" />
        </svg>
      );
    default:
      return null;
  }
}

function ShapeGlyph({ shape }) {
  const shared = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true"
  };

  switch (shape) {
    case "rectangle":
      return <svg {...shared}><rect x="5" y="8" width="14" height="8" rx="1.5" /></svg>;
    case "round-rectangle":
      return <svg {...shared}><rect x="5" y="7" width="14" height="10" rx="3.5" /></svg>;
    case "ellipse":
      return <svg {...shared}><ellipse cx="12" cy="12" rx="6.5" ry="5.2" /></svg>;
    case "diamond":
      return <svg {...shared}><path d="M12 5l6 7-6 7-6-7z" /></svg>;
    case "hexagon":
      return <svg {...shared}><path d="M8 6h8l4 6-4 6H8l-4-6z" /></svg>;
    case "octagon":
      return <svg {...shared}><path d="M9 4h6l5 5v6l-5 5H9l-5-5V9z" /></svg>;
    case "parallelogram":
      return <svg {...shared}><path d="M8 6h10l-2 12H6z" /></svg>;
    case "pentagon":
      return <svg {...shared}><path d="M12 4l7 5v7l-7 4-7-4V9z" /></svg>;
    case "star":
      return <svg {...shared}><path d="M12 4l2.2 4.7 5.2.5-3.9 3.5 1.1 5.1-4.6-2.6-4.6 2.6 1.1-5.1-3.9-3.5 5.2-.5z" /></svg>;
    case "cross":
      return <svg {...shared}><path d="M12 6v12" /><path d="M6 12h12" /></svg>;
    case "triangle-up":
      return <svg {...shared}><path d="M12 6l6 12H6z" /></svg>;
    case "triangle-down":
      return <svg {...shared}><path d="M6 6h12l-6 12z" /></svg>;
    case "triangle-left":
      return <svg {...shared}><path d="M6 12l12-6v12z" /></svg>;
    case "triangle-right":
      return <svg {...shared}><path d="M18 12L6 6v12z" /></svg>;
    case "connector":
      return <svg {...shared}><path d="M6 18L18 6" /></svg>;
    default:
      return null;
  }
}

class FieldDraggingTool extends go.DraggingTool {
  constructor(fieldTemplate) {
    super();
    this.fieldTemplate = fieldTemplate;
    this.temporaryPart = null;
    this.sourceNode = null;
    this.draggedField = null;
    this.logDebug = null;
    this.mouseDownObject = null;
    this.mouseDownPoint = null;
  }

  describeObject(obj) {
    if (obj === null) {
      return "null";
    }
    const parts = [];
    let current = obj;
    let guard = 0;
    while (current !== null && guard < 12) {
      const name = current.name ? `#${current.name}` : "";
      const type = current.type ? `:${current.type}` : "";
      parts.push(`${current.constructor.name}${name}${type}`);
      current = current.panel;
      guard += 1;
    }
    return parts.join(" <- ");
  }

  findNamedAncestor(obj, name) {
    let current = obj;
    while (current !== null && current.name !== name) {
      current = current.panel;
    }
    return current && current.name === name ? current : null;
  }

  findFieldRowAt(point) {
    const diagram = this.diagram;
    let obj = diagram.findObjectAt(point);
    while (obj !== null && obj.name !== "FIELD_ROW") {
      obj = obj.panel;
    }
    if (obj !== null && obj.name === "FIELD_ROW" && obj.data) {
      return obj;
    }
    return null;
  }

  findFieldRowFromInput(input) {
    if (!input) {
      return null;
    }
    const target = input.targetObject || null;
    const fromTarget = this.findNamedAncestor(target, "FIELD_ROW");
    if (fromTarget !== null && fromTarget.data) {
      return fromTarget;
    }
    return this.findFieldRowAt(input.documentPoint);
  }

  findFieldRowFromMouseDown() {
    const fromTarget = this.findNamedAncestor(this.mouseDownObject, "FIELD_ROW");
    if (fromTarget !== null && fromTarget.data) {
      return fromTarget;
    }
    if (this.mouseDownPoint) {
      return this.findFieldRowAt(this.mouseDownPoint);
    }
    return null;
  }

  findHeaderHandleAt(point) {
    const diagram = this.diagram;
    let obj = diagram.findObjectAt(point);
    while (obj !== null && obj.name !== "ENTITY_DRAG_HANDLE") {
      obj = obj.panel;
    }
    if (obj !== null && obj.name === "ENTITY_DRAG_HANDLE") {
      return obj;
    }
    return null;
  }

  findHeaderHandleFromInput(input) {
    if (!input) {
      return null;
    }
    const target = input.targetObject || null;
    const fromTarget = this.findNamedAncestor(target, "ENTITY_DRAG_HANDLE");
    if (fromTarget !== null) {
      return fromTarget;
    }
    return this.findHeaderHandleAt(input.documentPoint);
  }

  findHeaderHandleFromMouseDown() {
    const fromTarget = this.findNamedAncestor(this.mouseDownObject, "ENTITY_DRAG_HANDLE");
    if (fromTarget !== null) {
      return fromTarget;
    }
    if (this.mouseDownPoint) {
      return this.findHeaderHandleAt(this.mouseDownPoint);
    }
    return null;
  }

  findDrawingPartFromMouseDown() {
    const part = this.mouseDownObject?.part;
    if (part instanceof go.Node && part.data?.category === "drawing") {
      return part;
    }
    return null;
  }

  rememberMouseDown(obj, point) {
    this.mouseDownObject = obj || null;
    this.mouseDownPoint = point ? point.copy() : null;
    if (this.logDebug) {
      this.logDebug(
        `mouse down captured -> target=${this.describeObject(this.mouseDownObject)} | point=${
          this.mouseDownPoint ? `${this.mouseDownPoint.x.toFixed(1)},${this.mouseDownPoint.y.toFixed(1)}` : "none"
        }`
      );
    }
  }

  canStart() {
    const diagram = this.diagram;
    if (!(diagram instanceof go.Diagram)) {
      return false;
    }

    const input = diagram.lastInput;
    if (!input.left) {
      return false;
    }
    if (diagram.isReadOnly || diagram.isModelReadOnly || !diagram.allowMove) {
      return false;
    }
    if (!this.isBeyondDragSize()) {
      return false;
    }

    const downInput = diagram.firstInput;
    const fieldRow = this.findFieldRowFromMouseDown() || this.findFieldRowFromInput(downInput);
    const headerHandle = this.findHeaderHandleFromMouseDown() || this.findHeaderHandleFromInput(downInput);
    const drawingPart = this.findDrawingPartFromMouseDown();
    const result = fieldRow !== null || headerHandle !== null || drawingPart !== null;

    if (this.logDebug) {
      this.logDebug(
        `canStart -> ${result} | capturedTarget=${this.describeObject(this.mouseDownObject)} | downTarget=${this.describeObject(
          downInput?.targetObject || null
        )} | currentTarget=${this.describeObject(input.targetObject || null)} | fieldRow=${
          fieldRow?.data?.name || "none"
        } | header=${headerHandle ? "yes" : "no"} | drawing=${drawingPart?.data?.key || "no"}`
      );
    }

    return result;
  }

  findDraggablePart() {
    const diagram = this.diagram;
    const downInput = diagram.firstInput;
    const point = this.mouseDownPoint || downInput.documentPoint;
    const obj = this.findFieldRowFromMouseDown() || this.findFieldRowFromInput(downInput);
    const drawingPart = this.findDrawingPartFromMouseDown();

    if (
      obj !== null &&
      obj.data &&
      this.fieldTemplate !== null &&
      this.temporaryPart === null
    ) {
      const tempPart = new go.Part("Table", { layerName: "Tool", locationSpot: go.Spot.Center }).add(this.fieldTemplate.copy());
      this.temporaryPart = tempPart;
      this.sourceNode = obj.part;
      this.draggedField = obj.data;
      tempPart.location = point;
      diagram.add(tempPart);
      tempPart.data = obj.data;
      if (this.logDebug) {
        this.logDebug(`field drag prepared -> ${obj.data.name} | source=${this.describeObject(downInput?.targetObject || null)}`);
      }
      return tempPart;
    }

    if (drawingPart !== null) {
      if (this.logDebug) {
        this.logDebug(`drawing drag prepared -> ${drawingPart.data?.key || "drawing"}`);
      }
      return drawingPart;
    }

    const headerHandle = this.findHeaderHandleFromMouseDown() || this.findHeaderHandleFromInput(downInput);
    if (headerHandle !== null && headerHandle.part instanceof go.Node) {
      if (this.logDebug) {
        this.logDebug(`node drag prepared from header -> ${headerHandle.part.data?.key || "unknown"}`);
      }
      return headerHandle.part;
    }

    if (this.logDebug) {
      this.logDebug(
        `findDraggablePart -> none | downTarget=${this.describeObject(downInput?.targetObject || null)} | point=${point.x.toFixed(1)},${point.y.toFixed(1)}`
      );
    }

    return null;
  }

  doActivate() {
    if (this.currentPart === null) {
      const preparedPart = this.findDraggablePart();
      if (preparedPart !== null) {
        this.currentPart = preparedPart;
      }
      if (this.logDebug) {
        this.logDebug(
          `doActivate prep -> currentPart=${this.currentPart ? this.currentPart.constructor.name : "null"} | temporary=${
            this.temporaryPart ? "yes" : "no"
          } | draggedField=${this.draggedField?.name || "none"}`
        );
      }
    }

    if (this.temporaryPart === null) {
      if (this.logDebug) {
        this.logDebug(
          `doActivate fallback -> currentPart=${this.currentPart ? this.currentPart.constructor.name : "null"} | target=${this.describeObject(
            this.mouseDownObject
          )}`
        );
      }
      return super.doActivate();
    }
    const diagram = this.diagram;
    this.standardMouseSelect();
    this.isActive = true;
    const map = new go.Map();
    map.set(this.temporaryPart, new go.DraggingInfo(diagram.lastInput.documentPoint.copy()));
    this.draggedParts = map;
    this.startTransaction("Drag Field");
    diagram.isMouseCaptured = true;
    if (this.logDebug && this.draggedField) {
      this.logDebug(
        `field drag start -> ${this.draggedField.name} | first=${diagram.firstInput.documentPoint.x.toFixed(1)},${diagram.firstInput.documentPoint.y.toFixed(
          1
        )} | last=${diagram.lastInput.documentPoint.x.toFixed(1)},${diagram.lastInput.documentPoint.y.toFixed(1)}`
      );
    }
  }

  doDeactivate() {
    if (this.temporaryPart === null) {
      this.sourceNode = null;
      this.draggedField = null;
      this.mouseDownObject = null;
      this.mouseDownPoint = null;
      return super.doDeactivate();
    }
    const diagram = this.diagram;
    if (this.temporaryPart !== null) {
      diagram.remove(this.temporaryPart);
    }
    this.temporaryPart = null;
    this.sourceNode = null;
    this.draggedField = null;
    this.mouseDownObject = null;
    this.mouseDownPoint = null;
    super.doDeactivate();
  }

  doMouseMove() {
    if (!this.isActive) {
      return;
    }
    if (this.temporaryPart === null) {
      return super.doMouseMove();
    }
    const diagram = this.diagram;
    const offset = diagram.lastInput.documentPoint.copy().subtract(diagram.firstInput.documentPoint);
    this.moveParts(this.draggedParts, offset, false);
  }

  doMouseUp() {
    if (!this.isActive) {
      return;
    }
    if (this.temporaryPart === null) {
      return super.doMouseUp();
    }

    const diagram = this.diagram;
    const draggedField = this.draggedField;

    if (this.temporaryPart !== null) {
      diagram.remove(this.temporaryPart);
      this.temporaryPart = null;
    }

    const destinationNode = diagram.findPartAt(diagram.lastInput.documentPoint, false);
    const hitObject = diagram.findObjectAt(diagram.lastInput.documentPoint);
    const targetRow = this.findNamedAncestor(hitObject, "FIELD_ROW");
    const targetField = targetRow?.data || null;
    let dropGroup = null;
    let panel = hitObject;
    while (panel !== null) {
      if (panel.name === "FIELD_ROW" && panel.data) {
        dropGroup = panel.data.pk ? "pk" : "column";
        break;
      }
      if (panel.name === "PK_FIELDS") {
        dropGroup = "pk";
        break;
      }
      if (panel.name === "NONPK_FIELDS") {
        dropGroup = "column";
        break;
      }
      if (panel.name === "PK_DIVIDER") {
        dropGroup = draggedField && draggedField.pk ? "column" : "pk";
        break;
      }
      panel = panel.panel;
    }

    if (
      destinationNode instanceof go.Node &&
      destinationNode.data &&
      Array.isArray(destinationNode.data.fields) &&
      this.sourceNode instanceof go.Node &&
      this.sourceNode.data &&
      Array.isArray(this.sourceNode.data.fields) &&
      draggedField &&
      dropGroup
    ) {
      const model = diagram.model;
      const sourceFields = this.sourceNode.data.fields;
      const destinationFields = destinationNode.data.fields;
      const sourceIndex = sourceFields.indexOf(draggedField);
      const originalTargetIndex = targetField ? sourceFields.indexOf(targetField) : -1;

      if (sourceIndex >= 0) {
        model.removeArrayItem(sourceFields, sourceIndex);
        model.setDataProperty(draggedField, "pk", dropGroup === "pk");

        let insertIndex;
        let dropDetails = "default tail placement";
        if (targetField && destinationFields.includes(targetField)) {
          const targetIndex = destinationFields.indexOf(targetField);

          if (destinationNode === this.sourceNode) {
            // Same-entity reorder must use the original row positions before the
            // dragged item is removed, otherwise the target index shifts and the
            // move can collapse back to its old position.
            const placeAfter = sourceIndex < originalTargetIndex;
            insertIndex = targetIndex + (placeAfter ? 1 : 0);
            dropDetails = `target=${targetField.name} originalTargetIndex=${originalTargetIndex} shiftedTargetIndex=${targetIndex} sameEntity=true sourceIndex=${sourceIndex} placeAfter=${placeAfter}`;
          } else {
            const targetBounds = targetRow?.actualBounds;
            const pointerY = diagram.lastInput.documentPoint.y;
            const rowTop = targetBounds ? targetBounds.y : 0;
            const rowHeight = targetBounds ? targetBounds.height : 0;
            const relativeY = targetBounds && rowHeight > 0 ? (pointerY - rowTop) / rowHeight : 0.5;
            const placeAfter = relativeY >= 0.68;
            insertIndex = targetIndex + (placeAfter ? 1 : 0);
            dropDetails = `target=${targetField.name} targetIndex=${targetIndex} sameEntity=false relativeY=${relativeY.toFixed(2)} placeAfter=${placeAfter}`;
          }
        } else if (dropGroup === "pk") {
          insertIndex = destinationFields.reduce((lastPkIndex, field, index) => (field.pk ? index + 1 : lastPkIndex), 0);
          dropDetails = `pk tail target, insert after last PK at ${insertIndex}`;
        } else {
          insertIndex = destinationFields.length;
          dropDetails = `non-pk tail target, insert at end ${insertIndex}`;
        }

        model.insertArrayItem(destinationFields, insertIndex, draggedField);

        // Force a full row-template refresh after PK/non-PK regrouping so reused
        // item panels do not keep stale badge colors from their previous field.
        if (destinationNode === this.sourceNode) {
          model.setDataProperty(destinationNode.data, "fields", [...destinationFields]);
          model.updateTargetBindings(destinationNode.data);
        } else {
          model.setDataProperty(this.sourceNode.data, "fields", [...sourceFields]);
          model.setDataProperty(destinationNode.data, "fields", [...destinationFields]);
          model.updateTargetBindings(this.sourceNode.data);
          model.updateTargetBindings(destinationNode.data);
        }

        sourceFields.forEach((field) => model.updateTargetBindings(field));
        if (destinationNode !== this.sourceNode) {
          destinationFields.forEach((field) => model.updateTargetBindings(field));
        }
        model.updateTargetBindings(draggedField);

        if (this.logDebug) {
          this.logDebug(
            `field dropped -> ${draggedField.name} to ${dropGroup.toUpperCase()} in ${destinationNode.data.key} at index ${insertIndex}${
              targetField ? ` near ${targetField.name}` : ""
            } | sourceIndex=${sourceIndex} | ${dropDetails}`
          );
        }
      } else if (this.logDebug) {
        this.logDebug(`field drop failed -> ${draggedField.name} not found in source`);
      }
    } else if (this.logDebug && draggedField) {
      this.logDebug(
        `field drop missed -> ${draggedField.name} | hit=${this.describeObject(hitObject)} | destination=${
          destinationNode instanceof go.Node ? destinationNode.data?.key || "node" : "none"
        } | group=${dropGroup || "none"}`
      );
    }

    this.transactionResult = "Drag Field";
    this.stopTool();
  }
}

function makeFieldTemplate() {
  return new go.Panel(
    "TableRow",
    {
      name: "FIELD_ROW",
      background: "rgba(0, 0, 0, 0)",
      cursor: "grab",
      click: (_, panel) => {
        const node = panel.part;
        if (!(node instanceof go.Node) || !node.data || !panel.data) {
          return;
        }
        const model = node.diagram?.model;
        if (!model) {
          return;
        }
        model.nodeDataArray.forEach((nodeData) => {
          const nextValue = nodeData === node.data ? panel.data.name : "";
          if ((nodeData.selectedFieldName || "") !== nextValue) {
            model.setDataProperty(nodeData, "selectedFieldName", nextValue);
            model.updateTargetBindings(nodeData);
          }
        });
      }
    }
  ).add(
    new go.Shape("RoundedRectangle", {
      column: 0,
      columnSpan: 3,
      stretch: go.GraphObject.Fill,
      fill: "rgba(41, 55, 72, 0.18)",
      stroke: "rgba(0, 0, 0, 0)",
      strokeWidth: 0,
      parameter1: 10
    })
      .bind("fill", "", (field, shape) => {
        const nodeData = shape.part?.data;
        return nodeData && nodeData.selectedFieldName === field.name ? "rgba(74, 130, 139, 0.92)" : "rgba(41, 55, 72, 0.18)";
      })
      .bind("stroke", "", (field, shape) => {
        const nodeData = shape.part?.data;
        return nodeData && nodeData.selectedFieldName === field.name ? "rgba(121, 208, 201, 0.58)" : "rgba(0, 0, 0, 0)";
      }),
    new go.Panel("Auto", {
      column: 0,
      margin: new go.Margin(6, 8, 6, 12)
    }).add(
      new go.Shape("RoundedRectangle", {
        fill: "#334155",
        strokeWidth: 0,
        parameter1: 10,
        minSize: new go.Size(36, 20)
      }).bind("fill", "", (field) => (field && field.pk ? "#7b6740" : "#42536a")),
      new go.TextBlock({
        width: 36,
        margin: new go.Margin(3, 8, 3, 8),
        stroke: "#f8fafc",
        font: "700 10px ui-monospace, SFMono-Regular, Menlo, monospace",
        textAlign: "center"
      }).bind("text", "", (field) => (field && field.pk ? "PK" : "COL"))
    ),
    new go.TextBlock({
      column: 1,
      width: 154,
      margin: new go.Margin(6, 8, 6, 0),
      stroke: "#ffffff",
      font: "600 13px Inter, system-ui, sans-serif"
    }).bind("text", "name"),
    new go.TextBlock({
      column: 2,
      width: 102,
      margin: new go.Margin(6, 10, 6, 8),
      stroke: "#aec2da",
      font: "12px ui-monospace, SFMono-Regular, Menlo, monospace",
      textAlign: "right"
    }).bind("text", "type")
  );
}

function makeCornerResizeAdornment() {
  return new go.Adornment("Spot").add(
    new go.Placeholder(),
    new go.Shape("Rectangle", {
      alignment: go.Spot.BottomRight,
      alignmentFocus: go.Spot.Center,
      desiredSize: new go.Size(14, 14),
      fill: "#38bdf8",
      stroke: "#e0f2fe",
      strokeWidth: 1,
      cursor: "se-resize",
      name: "BOTTOM_RIGHT"
    })
  );
}

function createDrawingTemplate() {
  const drawingBody = new go.Panel("Spot", { name: "DRAWING_BODY" }).add(
    new go.Shape({
      name: "DRAWING_SHAPE",
      fill: "#edf1f7",
      stroke: "#c9d4e6",
      strokeWidth: 2,
      parameter1: 16,
      desiredSize: new go.Size(160, 96)
    })
      .bind("figure", "drawingShape", (shapeId) => getDrawingFigureConfig(shapeId).figure || "Rectangle")
      .bind("geometry", "drawingShape", (shapeId) => {
        const config = getDrawingFigureConfig(shapeId);
        return config.geometry ? go.Geometry.parse(config.geometry, true) : null;
      })
      .bind("desiredSize", "drawingShape", (shapeId) => {
        const [width, height] = getDrawingFigureConfig(shapeId).size;
        return new go.Size(width, height);
      })
      .bind("fill", "drawingShape", (shapeId) => (getDrawingFigureConfig(shapeId).lineOnly ? null : "#edf1f7"))
      .bind("parameter1", "drawingShape", (shapeId) => getDrawingFigureConfig(shapeId).corner || 16),
    new go.TextBlock({
      editable: false,
      textAlign: "center",
      stroke: "#182435",
      font: "600 15px Inter, system-ui, sans-serif",
      wrap: go.TextBlock.WrapFit,
      maxSize: new go.Size(120, 80),
      alignment: go.Spot.Center
    })
      .bind("text", "text")
      .bind("visible", "drawingShape", (shapeId) => !getDrawingFigureConfig(shapeId).lineOnly)
  );

  return new go.Node(
    "Spot",
    {
      locationSpot: go.Spot.Center,
      selectionObjectName: "DRAWING_BODY",
      movable: true,
      resizable: true,
      resizeObjectName: "DRAWING_SHAPE",
      resizeAdornmentTemplate: makeCornerResizeAdornment(),
      cursor: "move",
      shadowVisible: true,
      shadowColor: "rgba(0, 0, 0, 0.28)",
      shadowOffset: new go.Point(0, 12),
      selectionChanged: (part) => {
        const shape = part.findObject("DRAWING_SHAPE");
        if (!shape) {
          return;
        }
        shape.stroke = part.isSelected ? "#f1bf52" : "#c9d4e6";
        shape.strokeWidth = part.isSelected ? 2.5 : 2;
      }
    },
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
    new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify)
  ).add(
    drawingBody
  );
}

function createNodeTemplate(fieldTemplate) {
  return new go.Node(
    "Auto",
    {
      locationSpot: go.Spot.Center,
      locationObjectName: "CARD",
      selectionObjectName: "CARD",
      selectionAdorned: false,
      movable: true,
      resizable: true,
      resizeObjectName: "CARD",
      resizeAdornmentTemplate: makeCornerResizeAdornment(),
      resizeComputation: (part, newRect) => {
        const title = part.findObject("ENTITY_TITLE");
        const closeButton = part.findObject("ENTITY_CLOSE");
        const titleWidth = title ? Math.max(title.naturalBounds.width, title.measuredBounds.width, 120) : 120;
        const closeWidth = closeButton ? Math.max(closeButton.naturalBounds.width, closeButton.measuredBounds.width, 14) : 14;
        const minimumHeaderWidth = 16 + titleWidth + 12 + closeWidth + 16 + 14;
        const minimumCardWidth = Math.max(300, Math.ceil(minimumHeaderWidth));
        return new go.Rect(
          newRect.x,
          newRect.y,
          Math.max(newRect.width, minimumCardWidth),
          Math.max(newRect.height, 150)
        );
      },
      layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
      fromSpot: go.Spot.LeftRightSides,
      toSpot: go.Spot.LeftRightSides,
      cursor: "default",
      shadowVisible: true,
      shadowColor: "rgba(0, 0, 0, 0.35)",
      shadowOffset: new go.Point(0, 18),
      selectionChanged: (part) => {
        const card = part.findObject("CARD");
        if (card) {
          card.stroke = part.isSelected ? "#f1bf52" : "rgba(133, 160, 191, 0.22)";
          card.strokeWidth = part.isSelected ? 2 : 1.5;
        }
      },
      mouseEnter: (_, node) => {
        if (node.isSelected) {
          return;
        }
        const shape = node.findObject("CARD");
        if (shape) {
          shape.stroke = "rgba(232, 237, 245, 0.72)";
        }
      },
      mouseLeave: (_, node) => {
        if (node.isSelected) {
          return;
        }
        const shape = node.findObject("CARD");
        if (shape) {
          shape.stroke = "rgba(133, 160, 191, 0.22)";
        }
      }
    },
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)
  )
    .add(
      new go.Shape("RoundedRectangle", {
        name: "CARD",
        parameter1: 16,
        fill: "#273243",
        stroke: "rgba(122, 145, 172, 0.2)",
        strokeWidth: 1,
        minSize: new go.Size(300, NaN)
      }),
      new go.Panel("Vertical", { stretch: go.GraphObject.Fill }).add(
        new go.Panel("Auto", {
          name: "ENTITY_DRAG_HANDLE",
          stretch: go.GraphObject.Horizontal,
          cursor: "move",
          minSize: new go.Size(NaN, 50)
        }).add(
          new go.Shape("RoundedRectangle", {
            parameter1: 16,
            stroke: "rgba(136, 159, 185, 0.12)",
            strokeWidth: 1,
            fill: "#273243",
            stretch: go.GraphObject.Fill,
            minSize: new go.Size(220, 50)
          }),
          new go.Panel("Table", {
            stretch: go.GraphObject.Horizontal,
            defaultAlignment: go.Spot.Left
          }).add(
            new go.TextBlock({
              name: "ENTITY_TITLE",
              row: 0,
              column: 0,
              margin: new go.Margin(13, 16, 12, 16),
              stroke: "#eff6ff",
              font: "900 15px Inter, system-ui, sans-serif",
              editable: false,
              width: 228,
              wrap: go.TextBlock.None,
              overflow: go.TextBlock.OverflowClip
            }).bind("text", "name"),
            new go.TextBlock({
              name: "ENTITY_CLOSE",
              row: 0,
              column: 1,
              text: "×",
              margin: new go.Margin(12, 16, 11, 6),
              stroke: "rgba(208, 223, 243, 0.72)",
              font: "700 15px Inter, system-ui, sans-serif",
              textAlign: "right",
              cursor: "pointer",
              isActionable: true,
              click: (event, obj) => {
                const part = obj.part;
                const diagram = part?.diagram;
                if (!(part instanceof go.Node) || !diagram) {
                  return;
                }
                diagram.commit(() => {
                  part.isSelected = true;
                  diagram.commandHandler.deleteSelection();
                }, "Delete Entity");
                event.handled = true;
              }
            })
          )
        ),
        new go.Panel("Vertical", {
          name: "FIELDS",
          padding: new go.Margin(10, 10, 12, 10),
          defaultAlignment: go.Spot.Left,
          stretch: go.GraphObject.Horizontal
        }).add(
          new go.Panel("Table", {
            name: "PK_FIELDS",
            stretch: go.GraphObject.Horizontal,
            defaultAlignment: go.Spot.Left,
            defaultRowSeparatorStroke: "rgba(133, 160, 191, 0.12)",
            itemTemplate: fieldTemplate
          }).bind("itemArray", "fields", (fields) => fields.filter((field) => field.pk)),
          new go.Panel("Vertical", {
            name: "PK_DIVIDER",
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(10, 0, 10, 0)
          })
            .bind("visible", "fields", (fields) => fields.some((field) => !field.pk))
            .add(
              new go.Panel("Spot", {
                stretch: go.GraphObject.Horizontal,
                height: 12
              }).add(
                new go.Shape("RoundedRectangle", {
                  stretch: go.GraphObject.Horizontal,
                  height: 10,
                  fill: "rgba(44, 58, 76, 0.88)",
                  stroke: "rgba(146, 173, 201, 0.08)",
                  strokeWidth: 1,
                  parameter1: 999
                }),
                new go.Shape("RoundedRectangle", {
                  width: 72,
                  height: 4,
                  fill: "rgba(125, 211, 252, 0.28)",
                  stroke: "rgba(0, 0, 0, 0)",
                  parameter1: 999,
                  alignment: go.Spot.Center
                })
              )
            ),
          new go.Panel("Table", {
            name: "NONPK_FIELDS",
            stretch: go.GraphObject.Horizontal,
            defaultAlignment: go.Spot.Left,
            defaultRowSeparatorStroke: "rgba(133, 160, 191, 0.12)",
            itemTemplate: fieldTemplate
          }).bind("itemArray", "fields", (fields) => fields.filter((field) => !field.pk))
        )
      )
    );
}

function createLinkTemplate() {
  return new go.Link(
    {
      selectionAdorned: true,
      routing: go.Link.Orthogonal,
      curve: go.Link.JumpGap,
      adjusting: go.Link.Stretch,
      corner: 10,
      selectable: true,
      relinkableFrom: true,
      relinkableTo: true,
      reshapable: true,
      resegmentable: true,
      toShortLength: 6
    },
    new go.Binding("points").makeTwoWay()
  ).add(
    new go.Shape({
      isPanelMain: true,
      stroke: "transparent",
      strokeWidth: 14
    }),
    new go.Shape({
      isPanelMain: true,
      stroke: "#88d6dc",
      strokeWidth: 2.4
    }).bind("strokeDashArray", "identifying", (identifying) => (identifying === false ? [7, 5] : null)),
    new go.Shape({
      toArrow: "Standard",
      fill: "#88d6dc",
      stroke: null,
      scale: 1.08
    }),
    new go.Panel("Auto", {
      segmentIndex: NaN,
      segmentFraction: 0.5
    }).add(
      new go.Shape("RoundedRectangle", {
        fill: "#e9eef7",
        stroke: "rgba(0,0,0,0.06)",
        strokeWidth: 1
      }),
      new go.TextBlock({
        margin: new go.Margin(4, 8, 4, 8),
        stroke: "#0f172a",
        font: "700 11px ui-monospace, SFMono-Regular, Menlo, monospace",
        editable: false
      }).bind("text", "text")
    )
  );
}

function buildModelData(diagram) {
  return {
    nodeDataArray: diagram.model.nodeDataArray.map((node) => structuredClone(node)),
    linkDataArray: diagram.model.linkDataArray.map((link) => structuredClone(link))
  };
}

function createRelationshipLink({ sourceKey, targetKey, identifying }) {
  return {
    key: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    from: sourceKey,
    to: targetKey,
    text: "1:N",
    identifying
  };
}

function createDrawingConnectorLink({ sourceKey, targetKey }) {
  return {
    key: `drawing_connector_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    category: "drawingConnector",
    from: sourceKey,
    to: targetKey
  };
}

function createDrawingNodeData({ shapeId, viewportCenter, index }) {
  const config = getDrawingFigureConfig(shapeId);
  const offset = (index % 4) * 28;
  return {
    key: `drawing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    category: "drawing",
    name: "Drawing",
    text: "Drawing",
    drawingShape: shapeId,
    color: "#edf1f7",
    loc: `${(viewportCenter.x + offset).toFixed(1)} ${(viewportCenter.y + offset).toFixed(1)}`,
    size: go.Size.stringify(new go.Size(config.size[0], config.size[1]))
  };
}

function createDrawingConnectorTemplate() {
  return new go.Link({
    category: "drawingConnector",
    selectionAdorned: true,
    routing: go.Link.Normal,
    curve: go.Link.Bezier,
    corner: 8,
    curviness: 26,
    selectable: true,
    relinkableFrom: true,
    relinkableTo: true,
    reshapable: true,
    resegmentable: true
  }).add(
    new go.Shape({
      isPanelMain: true,
      stroke: "transparent",
      strokeWidth: 14
    }),
    new go.Shape({
      isPanelMain: true,
      stroke: "#7ea6ff",
      strokeWidth: 2.6
    })
  );
}

function App() {
  const diagramDivRef = useRef(null);
  const paletteDivRef = useRef(null);
  const overviewDivRef = useRef(null);
  const diagramRef = useRef(null);
  const paletteRef = useRef(null);
  const overviewRef = useRef(null);
  const isApplyingRef = useRef(false);
  const resizeStateRef = useRef(null);

  const [model, setModel] = useState(() => cloneModel());
  const [selectedNode, setSelectedNode] = useState(emptySelection);
  const [schemaJson, setSchemaJson] = useState(() => JSON.stringify(initialModel, null, 2));
  const [debugMessages, setDebugMessages] = useState([]);
  const [leftRailWidth, setLeftRailWidth] = useState(LEFT_RAIL_DEFAULT);
  const [rightRailWidth, setRightRailWidth] = useState(RIGHT_RAIL_DEFAULT);
  const [activeDiagramTool, setActiveDiagramTool] = useState(null);
  const [drawingPaletteOpen, setDrawingPaletteOpen] = useState(false);
  const relationshipModeRef = useRef(null);
  const drawingConnectorModeRef = useRef(null);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) {
        return;
      }

      if (resizeState.side === "left") {
        const nextWidth = Math.min(Math.max(event.clientX - resizeState.startX + resizeState.startWidth, LEFT_RAIL_MIN), LEFT_RAIL_MAX);
        setLeftRailWidth(nextWidth);
        return;
      }

      const nextWidth = Math.min(
        Math.max(resizeState.startWidth - (event.clientX - resizeState.startX), RIGHT_RAIL_MIN),
        RIGHT_RAIL_MAX
      );
      setRightRailWidth(nextWidth);
    };

    const handlePointerUp = () => {
      resizeStateRef.current = null;
      document.body.classList.remove("is-resizing-panels");
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    const logDebug = (message) => {
      const entry = `${new Date().toLocaleTimeString()}: ${message}`;
      console.log(`[gojs-debug] ${entry}`);
      setDebugMessages((current) => [entry, ...current].slice(0, 16));
    };

    const describeObject = (obj) => {
      if (obj === null) {
        return "null";
      }
      const parts = [];
      let current = obj;
      let guard = 0;
      while (current !== null && guard < 12) {
        const name = current.name ? `#${current.name}` : "";
        const type = current.type ? `:${current.type}` : "";
        parts.push(`${current.constructor.name}${name}${type}`);
        current = current.panel;
        guard += 1;
      }
      return parts.join(" <- ");
    };

    const clearFieldSelectionHighlights = () => {
      const diagram = diagramRef.current;
      if (!(diagram instanceof go.Diagram)) {
        return;
      }
      const model = diagram.model;
      let changed = false;
      diagram.model.nodeDataArray.forEach((nodeData) => {
        if (nodeData && nodeData.selectedFieldName) {
          model.setDataProperty(nodeData, "selectedFieldName", "");
          model.updateTargetBindings(nodeData);
          changed = true;
        }
      });
      if (changed) {
        logDebug("field selection cleared");
      }
    };

    const updateSelection = () => {
      const diagram = diagramRef.current;
      if (!(diagram instanceof go.Diagram)) {
        return;
      }
      const part = diagram.selection.first();
      if (part instanceof go.Node && part.data) {
        setSelectedNode(normalizeSelectionData(structuredClone(part.data)));
        logDebug(
          `selection changed -> ${part.data.key} at ${part.location.x.toFixed(1)}, ${part.location.y.toFixed(1)} movable=${part.movable}`
        );
        return;
      }
      logDebug("selection cleared");
      setSelectedNode(emptySelection);
    };

    const pushStateFromDiagram = () => {
      if (isApplyingRef.current) {
        return;
      }
      const diagram = diagramRef.current;
      if (!(diagram instanceof go.Diagram)) {
        return;
      }
      const nextModel = buildModelData(diagram);
      setModel(nextModel);
      setSchemaJson(JSON.stringify(nextModel, null, 2));
      updateSelection();
    };

    const diagram = new go.Diagram(diagramDivRef.current, {
      allowMove: true,
      "undoManager.isEnabled": true,
      "linkingTool.isUnconnectedLinkValid": false,
      "relinkingTool.isUnconnectedLinkValid": false,
      "linkingTool.portGravity": 20,
      "relinkingTool.portGravity": 20,
      "commandHandler.copiesTree": false,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(20, 20),
      "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom
    });

    diagram.grid = new go.Panel("Grid").add(
      new go.Shape("LineH", { stroke: "rgba(148, 163, 184, 0.15)" }),
      new go.Shape("LineV", { stroke: "rgba(148, 163, 184, 0.15)" })
    );
    const fieldTemplate = makeFieldTemplate();
    const fieldDraggingTool = new FieldDraggingTool(fieldTemplate);
    fieldDraggingTool.logDebug = logDebug;
    diagram.toolManager.draggingTool = fieldDraggingTool;
    const toolManager = diagram.toolManager;
    const originalToolManagerDoMouseDown = toolManager.doMouseDown.bind(toolManager);
    toolManager.doMouseDown = function doMouseDownWithFieldCapture() {
      const point = diagram.lastInput.documentPoint.copy();
      const obj = diagram.findObjectAt(point);
      fieldDraggingTool.rememberMouseDown(obj, point);
      return originalToolManagerDoMouseDown();
    };
    diagram.toolManager.linkReshapingTool.isEnabled = true;
    diagram.toolManager.linkReshapingTool.handleArchetype = new go.Shape("Diamond", {
      desiredSize: new go.Size(10, 10),
      fill: "#7dd3fc",
      stroke: "#0ea5e9",
      cursor: "move"
    });
    diagram.toolManager.linkReshapingTool.midHandleArchetype = new go.Shape("Diamond", {
      desiredSize: new go.Size(9, 9),
      fill: "#e0f2fe",
      stroke: "#38bdf8",
      cursor: "move"
    });
    diagram.nodeTemplate = createNodeTemplate(fieldTemplate);
    diagram.nodeTemplateMap.add("drawing", createDrawingTemplate());
    diagram.linkTemplate = createLinkTemplate();
    diagram.linkTemplateMap.add("drawingConnector", createDrawingConnectorTemplate());

    const draggingTool = diagram.toolManager.draggingTool;
    const originalDoActivate = draggingTool.doActivate.bind(draggingTool);
    draggingTool.doActivate = function doActivateWithDebug() {
      const part = this.currentPart;
      if (part instanceof go.Node && part.data) {
        logDebug(
          `drag start -> ${part.data.key} from ${part.location.x.toFixed(1)}, ${part.location.y.toFixed(1)} movable=${part.movable}`
        );
      } else {
        logDebug("drag start -> no node part detected");
      }
      return originalDoActivate();
    };

    const originalDoDeactivate = draggingTool.doDeactivate.bind(draggingTool);
    draggingTool.doDeactivate = function doDeactivateWithDebug() {
      const selection = diagram.selection.first();
      if (selection instanceof go.Node && selection.data) {
        logDebug(
          `drag end -> ${selection.data.key} now at ${selection.location.x.toFixed(1)}, ${selection.location.y.toFixed(1)}`
        );
      } else {
        logDebug("drag end -> no selected node");
      }
      return originalDoDeactivate();
    };

    const linkingTool = diagram.toolManager.linkingTool;
    const originalLinkActivate = linkingTool.doActivate.bind(linkingTool);
    linkingTool.doActivate = function doActivateWithDebug() {
      logDebug("link tool activated");
      return originalLinkActivate();
    };

    const palette = new go.Palette(paletteDivRef.current, {
      "animationManager.isEnabled": false,
      contentAlignment: go.Spot.Center,
      layout: new go.GridLayout({
        wrappingColumn: 1,
        cellSize: new go.Size(1, 1),
        spacing: new go.Size(12, 12)
      }),
      nodeTemplate: createNodeTemplate(makeFieldTemplate())
    });
    palette.nodeTemplateMap.add("drawing", createDrawingTemplate());

    const overview = new go.Overview(overviewDivRef.current, {
      observed: diagram,
      contentAlignment: go.Spot.Center
    });

    diagramRef.current = diagram;
    paletteRef.current = palette;
    overviewRef.current = overview;

    diagram.addDiagramListener("ChangedSelection", updateSelection);
    diagram.addDiagramListener("ObjectSingleClicked", (event) => {
      let current = event.subject;
      let clickedFieldRow = false;
      while (current !== null) {
        if (current.name === "FIELD_ROW") {
          clickedFieldRow = true;
          break;
        }
        current = current.panel;
      }

      if (!clickedFieldRow) {
        clearFieldSelectionHighlights();
      }

      const part = event.subject.part;
      const drawingConnectorMode = drawingConnectorModeRef.current;
      if (drawingConnectorMode && part instanceof go.Node && part.data?.key && !clickedFieldRow) {
        if (part.data.key === drawingConnectorMode.sourceKey) {
          logDebug(`drawing connector -> source ${part.data.key} reselected, waiting for target`);
          return;
        }

        const duplicateConnector = diagram.model.linkDataArray.some(
          (link) => link.category === "drawingConnector" && link.from === drawingConnectorMode.sourceKey && link.to === part.data.key
        );

        if (duplicateConnector) {
          logDebug(`drawing connector -> link already exists from ${drawingConnectorMode.sourceKey} to ${part.data.key}`);
          clearDiagramToolMode();
          return;
        }

        diagram.startTransaction("Add Drawing Connector");
        diagram.model.addLinkData(
          createDrawingConnectorLink({
            sourceKey: drawingConnectorMode.sourceKey,
            targetKey: part.data.key
          })
        );
        diagram.commitTransaction("Add Drawing Connector");
        logDebug(`drawing connector created -> ${drawingConnectorMode.sourceKey} to ${part.data.key}`);
        clearDiagramToolMode();
        return;
      }

      const relationshipMode = relationshipModeRef.current;
      if (relationshipMode && part instanceof go.Node && part.data?.key && !clickedFieldRow) {
        if (part.data.key === relationshipMode.sourceKey) {
          logDebug(`relationship tool -> source ${part.data.key} reselected, waiting for target`);
          return;
        }

        const duplicateLink = diagram.model.linkDataArray.some(
          (link) =>
            link.from === relationshipMode.sourceKey &&
            link.to === part.data.key &&
            !!link.identifying === (relationshipMode.type === "identifying")
        );

        if (duplicateLink) {
          logDebug(`relationship tool -> link already exists from ${relationshipMode.sourceKey} to ${part.data.key}`);
          clearDiagramToolMode();
          return;
        }

        diagram.startTransaction("Add Relationship");
        diagram.model.addLinkData(
          createRelationshipLink({
            sourceKey: relationshipMode.sourceKey,
            targetKey: part.data.key,
            identifying: relationshipMode.type === "identifying"
          })
        );
        diagram.commitTransaction("Add Relationship");
        logDebug(`relationship created -> ${relationshipMode.sourceKey} to ${part.data.key} (${relationshipMode.type})`);
        clearDiagramToolMode();
        return;
      }

      if (part instanceof go.Node && part.data) {
        logDebug(`click -> ${part.data.key} | target=${describeObject(event.subject)}`);
      } else if (part instanceof go.Link) {
        logDebug(`click -> relationship link | target=${describeObject(event.subject)}`);
      } else {
        logDebug(`click -> non-node object | target=${describeObject(event.subject)}`);
      }
    });
    diagram.addDiagramListener("BackgroundSingleClicked", () => {
      clearFieldSelectionHighlights();
      logDebug("background click");
    });
    diagram.addDiagramListener("SelectionMoved", () => {
      const part = diagram.selection.first();
      if (part instanceof go.Node && part.data) {
        logDebug(
          `selection moved -> ${part.data.key} at ${part.location.x.toFixed(1)}, ${part.location.y.toFixed(1)}`
        );
      } else {
        logDebug("selection moved event fired");
      }
    });
    diagram.addDiagramListener("PartResized", () => {
      const part = diagram.selection.first();
      if (part instanceof go.Node && part.data) {
        logDebug(`resized -> ${part.data.key}`);
      } else {
        logDebug("part resized");
      }
    });
    const clickSelectingTool = diagram.toolManager.clickSelectingTool;
    const originalStandardMouseSelect = clickSelectingTool.standardMouseSelect.bind(clickSelectingTool);
    clickSelectingTool.standardMouseSelect = function standardMouseSelectWithDebug() {
      logDebug(`mouse select -> target=${describeObject(diagram.lastInput.targetObject || null)}`);
      return originalStandardMouseSelect();
    };
    diagram.addModelChangedListener((event) => {
      if (event.isTransactionFinished) {
        logDebug(`model transaction -> ${event.oldValue || event.modelChange || event.propertyName || "updated"}`);
        pushStateFromDiagram();
      }
    });

    palette.model = createGraphLinksModel({ nodeDataArray: paletteItems, linkDataArray: [] });

    isApplyingRef.current = true;
    diagram.model = createGraphLinksModel(cloneModel());
    isApplyingRef.current = false;
    pushStateFromDiagram();

    return () => {
      overview.div = null;
      palette.div = null;
      diagram.div = null;
      overviewRef.current = null;
      paletteRef.current = null;
      diagramRef.current = null;
    };
  }, []);

  const applyModelToDiagram = (nextModel) => {
    const diagram = diagramRef.current;
    if (!(diagram instanceof go.Diagram)) {
      return;
    }
    isApplyingRef.current = true;
    diagram.model = createGraphLinksModel(nextModel);
    isApplyingRef.current = false;
    setModel(nextModel);
    setSchemaJson(JSON.stringify(nextModel, null, 2));
  };

  const addEntity = () => {
    const diagram = diagramRef.current;
    if (!(diagram instanceof go.Diagram)) {
      return;
    }

    const index = diagram.model.nodeDataArray.length + 1;
    const viewportCenter = diagram.viewportBounds.center;
    const offset = (index % 4) * 36;
    const newNode = {
      key: `table_${Date.now()}`,
      name: `new_table_${index}`,
      color: "#2563eb",
      loc: `${(viewportCenter.x + offset).toFixed(1)} ${(viewportCenter.y + offset).toFixed(1)}`,
      fields: [
        { name: "id", type: "uuid", pk: true, nullable: false },
        { name: "created_at", type: "timestamp", nullable: false }
      ]
    };

    diagram.startTransaction("Add Entity");
    diagram.model.addNodeData(newNode);
    diagram.commitTransaction("Add Entity");
  };

  const clearDiagramToolMode = () => {
    relationshipModeRef.current = null;
    drawingConnectorModeRef.current = null;
    setActiveDiagramTool(null);
  };

  const startRelationshipMode = (type) => {
    const diagram = diagramRef.current;
    if (!(diagram instanceof go.Diagram)) {
      return;
    }

    const selectedPart = diagram.selection.first();
    if (!(selectedPart instanceof go.Node) || !selectedPart.data?.key) {
      setDebugMessages((current) => [
        `${new Date().toLocaleTimeString()}: relationship tool -> select a source entity first`,
        ...current
      ].slice(0, 16));
      return;
    }

    relationshipModeRef.current = {
      type,
      sourceKey: selectedPart.data.key
    };
    setActiveDiagramTool(type);
    setDebugMessages((current) => [
      `${new Date().toLocaleTimeString()}: relationship tool armed -> ${type} from ${selectedPart.data.key}`,
      ...current
    ].slice(0, 16));
  };

  const handleChooseDrawingShape = (shapeId) => {
    const diagram = diagramRef.current;
    if (!(diagram instanceof go.Diagram)) {
      return;
    }

    if (shapeId === "connector") {
      const selectedPart = diagram.selection.first();
      if (!(selectedPart instanceof go.Node) || selectedPart.data?.category !== "drawing" || !selectedPart.data?.key) {
        setDebugMessages((current) => [
          `${new Date().toLocaleTimeString()}: drawing connector -> select a source drawing object first`,
          ...current
        ].slice(0, 16));
        return;
      }

      drawingConnectorModeRef.current = {
        sourceKey: selectedPart.data.key
      };
      setActiveDiagramTool("connector");
      setDrawingPaletteOpen(false);
      setDebugMessages((current) => [
        `${new Date().toLocaleTimeString()}: drawing connector armed -> from ${selectedPart.data.key}`,
        ...current
      ].slice(0, 16));
      return;
    }

    const drawingNode = createDrawingNodeData({
      shapeId,
      viewportCenter: diagram.viewportBounds.center,
      index: diagram.model.nodeDataArray.length + 1
    });

    diagram.startTransaction("Add Drawing");
    diagram.model.addNodeData(drawingNode);
    diagram.commitTransaction("Add Drawing");
    setDrawingPaletteOpen(false);
    setDebugMessages((current) => [
      `${new Date().toLocaleTimeString()}: drawing created -> ${shapeId}`,
      ...current
    ].slice(0, 16));
  };

  const autoLayout = () => {
    const diagram = diagramRef.current;
    if (!(diagram instanceof go.Diagram)) {
      return;
    }
    const layout = new go.ForceDirectedLayout({
      defaultSpringLength: 120,
      defaultElectricalCharge: 140,
      isInitial: false,
      isOngoing: false
    });
    diagram.startTransaction("auto layout");
    layout.doLayout(diagram);
    diagram.commitTransaction("auto layout");
  };

  const resetModel = () => {
    applyModelToDiagram(cloneModel());
    setSelectedNode(emptySelection);
  };

  const startPanelResize = (side) => (event) => {
    resizeStateRef.current = {
      side,
      startX: event.clientX,
      startWidth: side === "left" ? leftRailWidth : rightRailWidth
    };
    document.body.classList.add("is-resizing-panels");
  };

  return (
    <div
      className="app-shell"
      style={{
        gridTemplateColumns: `${leftRailWidth}px 10px minmax(0, 1fr) 10px ${rightRailWidth}px`
      }}
    >
      <aside className="left-rail">
        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow">Starter Nodes</p>
            <h2>Palette</h2>
          </div>
          <div ref={paletteDivRef} className="palette-component" />
        </div>

        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow">Canvas Tools</p>
            <h2>Diagram Box</h2>
          </div>
          <div className="tool-grid">
            {DIAGRAM_BOX_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tool-tile${item.id === "materialized" ? " tool-tile--wide-label" : ""}${
                  activeDiagramTool === item.id ? " tool-tile--active" : ""
                }`}
                onClick={() => {
                  if (item.id === "entity") {
                    addEntity();
                    return;
                  }
                  if (item.id === "identifying" || item.id === "non-identifying") {
                    if (activeDiagramTool === item.id) {
                      clearDiagramToolMode();
                      return;
                    }
                    startRelationshipMode(item.id);
                  }
                }}
                title={item.tooltip}
                aria-label={item.tooltip}
              >
                <span className="tool-tile__icon">
                  <ToolGlyph icon={item.icon} />
                </span>
                <span className="tool-tile__label">{item.label}</span>
                <span className="tool-tile__tooltip">{item.tooltip}</span>
              </button>
            ))}
          </div>

          <div className="tool-box-subsection">
            <h3>Drawing Box</h3>
            <div className="drawing-box-shell">
              <div className="tool-grid tool-grid--single">
              {DRAWING_BOX_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`tool-tile tool-tile--compact${drawingPaletteOpen ? " tool-tile--active" : ""}`}
                  onClick={() => setDrawingPaletteOpen((current) => !current)}
                  title={item.tooltip}
                  aria-label={item.tooltip}
                >
                  <span className="tool-tile__icon">
                    <ToolGlyph icon={item.icon} />
                  </span>
                  <span className="tool-tile__label">{item.label}</span>
                  <span className="tool-tile__tooltip">{item.tooltip}</span>
                </button>
              ))}
              </div>

              {drawingPaletteOpen ? (
                <div className="diagram-shape-palette">
                  <div className="diagram-shape-palette-title">Choose Shape</div>
                  <div className="diagram-shape-palette-grid">
                    {DRAWING_SHAPE_ITEMS.map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        className={`diagram-shape-option${activeDiagramTool === "connector" && shape.id === "connector" ? " tool-tile--active" : ""}`}
                        onClick={() => handleChooseDrawingShape(shape.id)}
                        title={shape.label}
                        aria-label={shape.label}
                      >
                        <span className="tool-tile__icon diagram-shape-option__icon">
                          <ShapeGlyph shape={shape.id} />
                        </span>
                        <span>{shape.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="panel compact">
          <div className="panel-header">
            <p className="eyebrow">Navigation</p>
            <h2>Overview</h2>
          </div>
          <div ref={overviewDivRef} className="overview-component" />
        </div>
      </aside>

      <div
        className="panel-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize left sidebar"
        onPointerDown={startPanelResize("left")}
      />

      <main className="workspace">
        <section className="hero">
          <div>
            <p className="eyebrow">Local GoJS Release</p>
            <h1>Data modeler for table design and relationships</h1>
            <p className="hero-copy">
              This sample is wired to the local GoJS release files, follows the official entity-relationship examples, and keeps the schema JSON live as you edit the canvas.
            </p>
          </div>
          <div className="toolbar">
            <button type="button" onClick={addEntity}>
              Add Entity
            </button>
            <button type="button" onClick={autoLayout}>
              Auto Layout
            </button>
            <button type="button" onClick={resetModel} className="ghost">
              Reset Sample
            </button>
          </div>
        </section>

        <section className="canvas-panel">
          <div ref={diagramDivRef} className="diagram-component" />
        </section>
      </main>

      <div
        className="panel-divider"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize right sidebar"
        onPointerDown={startPanelResize("right")}
      />

      <aside className="right-rail">
        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow">Selected Entity</p>
            <h2>{selectedNode.name || "Nothing selected"}</h2>
          </div>
          {selectedNode.key ? (
            <div className="details">
              <div className="swatch-row">
                <span className="swatch" style={{ backgroundColor: selectedNode.color }} />
                <span>{selectedNode.key}</span>
              </div>
              {selectedNode.fields.length > 0 ? (
                <div className="field-list">
                  {selectedNode.fields.map((field) => (
                    <div key={`${selectedNode.key}-${field.name}`} className="field-card">
                      <div>
                        <strong>{field.name}</strong>
                        <span>{field.type}</span>
                      </div>
                      <small>{fieldBadges(field).join(" · ")}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">This selected object does not have columns.</p>
              )}
            </div>
          ) : (
            <p className="empty-state">Click a table in the canvas to inspect its structure here.</p>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow">Schema Snapshot</p>
            <h2>Model JSON</h2>
          </div>
          <pre className="json-preview">{schemaJson}</pre>
        </div>

        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow">Debug</p>
            <h2>Drag Diagnostics</h2>
          </div>
          <div className="debug-log">
            {debugMessages.length > 0 ? (
              debugMessages.map((message, index) => (
                <div key={`${message}-${index}`} className="debug-line">
                  {message}
                </div>
              ))
            ) : (
              <div className="debug-line">No diagram events yet.</div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
