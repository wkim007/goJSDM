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

const LEFT_RAIL_DEFAULT = 280;
const RIGHT_RAIL_DEFAULT = 360;
const LEFT_RAIL_MIN = 220;
const LEFT_RAIL_MAX = 520;
const RIGHT_RAIL_MIN = 260;
const RIGHT_RAIL_MAX = 560;

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

class FieldDraggingTool extends go.DraggingTool {
  constructor(fieldTemplate) {
    super();
    this.fieldTemplate = fieldTemplate;
    this.temporaryPart = null;
    this.sourceNode = null;
    this.draggedField = null;
  }

  findDraggablePart() {
    const diagram = this.diagram;
    let obj = diagram.findObjectAt(diagram.lastInput.documentPoint);
    while (obj !== null && obj.type !== go.Panel.TableRow) {
      obj = obj.panel;
    }

    if (
      obj !== null &&
      obj.type === go.Panel.TableRow &&
      obj.data &&
      this.fieldTemplate !== null &&
      this.temporaryPart === null
    ) {
      const tempPart = new go.Part("Table", { layerName: "Tool", locationSpot: go.Spot.Center }).add(this.fieldTemplate.copy());
      this.temporaryPart = tempPart;
      this.sourceNode = obj.part;
      this.draggedField = obj.data;
      tempPart.location = diagram.lastInput.documentPoint;
      diagram.add(tempPart);
      tempPart.data = obj.data;
      return tempPart;
    }

    return super.findDraggablePart();
  }

  doActivate() {
    if (this.temporaryPart === null) {
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
  }

  doDeactivate() {
    if (this.temporaryPart === null) {
      return super.doDeactivate();
    }
    const diagram = this.diagram;
    if (this.temporaryPart !== null) {
      diagram.remove(this.temporaryPart);
    }
    this.temporaryPart = null;
    this.sourceNode = null;
    this.draggedField = null;
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
    const destinationNode = diagram.findPartAt(diagram.lastInput.documentPoint, false);
    const hitObject = diagram.findObjectAt(diagram.lastInput.documentPoint);
    let dropGroup = null;
    let panel = hitObject;
    while (panel !== null) {
      if (panel.name === "PK_FIELDS") {
        dropGroup = "pk";
        break;
      }
      if (panel.name === "NONPK_FIELDS") {
        dropGroup = "column";
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
      this.draggedField &&
      dropGroup
    ) {
      const model = diagram.model;
      const sourceFields = this.sourceNode.data.fields;
      const destinationFields = destinationNode.data.fields;
      const sourceIndex = sourceFields.indexOf(this.draggedField);

      if (sourceIndex >= 0) {
        model.removeArrayItem(sourceFields, sourceIndex);
        model.setDataProperty(this.draggedField, "pk", dropGroup === "pk");

        const insertIndex =
          dropGroup === "pk"
            ? destinationFields.reduce((lastPkIndex, field, index) => (field.pk ? index + 1 : lastPkIndex), 0)
            : destinationFields.length;

        model.insertArrayItem(destinationFields, insertIndex, this.draggedField);
        model.updateTargetBindings(this.sourceNode.data);
        if (destinationNode !== this.sourceNode) {
          model.updateTargetBindings(destinationNode.data);
        }
      }
    }

    this.transactionResult = "Drag Field";
    this.stopTool();
  }
}

function makeFieldTemplate() {
  return new go.Panel(
    "TableRow",
    {
      background: "rgba(0, 0, 0, 0)"
    }
  ).add(
    new go.Shape("RoundedRectangle", {
      column: 0,
      columnSpan: 3,
      stretch: go.GraphObject.Fill,
      fill: "rgba(41, 55, 72, 0.18)",
      strokeWidth: 0,
      parameter1: 10
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
      }).bind("fill", "pk", (pk) => (pk ? "#7b6740" : "#42536a")),
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

function createNodeTemplate() {
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
      layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
      fromSpot: go.Spot.LeftRightSides,
      toSpot: go.Spot.LeftRightSides,
      cursor: "move",
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
        fill: "#243142",
        stroke: "rgba(133, 160, 191, 0.22)",
        strokeWidth: 1.5,
        minSize: new go.Size(300, NaN)
      }),
      new go.Panel("Vertical", { stretch: go.GraphObject.Fill }).add(
        new go.Panel("Auto", {
          stretch: go.GraphObject.Horizontal,
          cursor: "move"
        }).add(
          new go.Shape("RoundedRectangle", {
            parameter1: 16,
            strokeWidth: 0,
            stretch: go.GraphObject.Fill,
            minSize: new go.Size(220, 0),
            margin: new go.Margin(0, 0, 0, 0)
          }).bind("fill", "color"),
          new go.Panel("Horizontal", {
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(10, 14, 10, 14)
          }).add(
            new go.TextBlock({
              stroke: "#eff6ff",
              font: "800 16px Inter, system-ui, sans-serif",
              editable: false,
              width: 212,
              wrap: go.TextBlock.None,
              overflow: go.TextBlock.OverflowClip
            }).bind("text", "name"),
            new go.TextBlock({
              stroke: "rgba(239, 246, 255, 0.74)",
              font: "700 15px Inter, system-ui, sans-serif",
              text: "×",
              alignment: go.Spot.Right,
              textAlign: "right"
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
            itemTemplate: makeFieldTemplate()
          }).bind("itemArray", "fields", (fields) => fields.filter((field) => field.pk)),
          new go.Panel("Vertical", {
            stretch: go.GraphObject.Horizontal,
            margin: new go.Margin(10, 0, 10, 0)
          })
            .bind("visible", "fields", (fields) => fields.some((field) => field.pk) && fields.some((field) => !field.pk))
            .add(
              new go.Shape("RoundedRectangle", {
                stretch: go.GraphObject.Horizontal,
                height: 14,
                fill: "rgba(54, 70, 89, 0.72)",
                stroke: "rgba(133, 160, 191, 0.10)",
                parameter1: 6
              }),
              new go.TextBlock({
                alignment: go.Spot.Center,
                margin: new go.Margin(-13, 0, 0, 0),
                stroke: "#8ea3bd",
                font: "600 10px Inter, system-ui, sans-serif",
                text: "Drop here to switch PK"
              })
            ),
          new go.Panel("Table", {
            name: "NONPK_FIELDS",
            stretch: go.GraphObject.Horizontal,
            defaultAlignment: go.Spot.Left,
            defaultRowSeparatorStroke: "rgba(133, 160, 191, 0.12)",
            itemTemplate: makeFieldTemplate()
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
    }),
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

    const updateSelection = () => {
      const diagram = diagramRef.current;
      if (!(diagram instanceof go.Diagram)) {
        return;
      }
      const part = diagram.selection.first();
      if (part instanceof go.Node && part.data) {
        setSelectedNode(structuredClone(part.data));
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
    diagram.nodeTemplate = createNodeTemplate();
    diagram.linkTemplate = createLinkTemplate();

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
      nodeTemplate: createNodeTemplate()
    });

    const overview = new go.Overview(overviewDivRef.current, {
      observed: diagram,
      contentAlignment: go.Spot.Center
    });

    diagramRef.current = diagram;
    paletteRef.current = palette;
    overviewRef.current = overview;

    diagram.addDiagramListener("ChangedSelection", updateSelection);
    diagram.addDiagramListener("ObjectSingleClicked", (event) => {
      const part = event.subject.part;
      if (part instanceof go.Node && part.data) {
        logDebug(`click -> ${part.data.key}`);
      } else if (part instanceof go.Link) {
        logDebug("click -> relationship link");
      } else {
        logDebug("click -> non-node object");
      }
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
    const nextModel = cloneModel(model);
    const index = nextModel.nodeDataArray.length + 1;
    nextModel.nodeDataArray.push({
      key: `table_${Date.now()}`,
      name: `new_table_${index}`,
      color: "#2563eb",
      loc: `${80 + index * 30} ${80 + index * 24}`,
      fields: [
        { name: "id", type: "uuid", pk: true, nullable: false },
        { name: "created_at", type: "timestamp", nullable: false }
      ]
    });
    applyModelToDiagram(nextModel);
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
