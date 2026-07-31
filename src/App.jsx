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

function makeFieldTemplate() {
  return new go.Panel("TableRow", { defaultAlignment: go.Spot.Left }).add(
    new go.TextBlock({
      column: 0,
      margin: new go.Margin(4, 8, 4, 10),
      stroke: "#dbeafe",
      font: "600 11px ui-monospace, SFMono-Regular, Menlo, monospace"
    }).bind("text", "", (field) => fieldBadges(field).join(" ")),
    new go.TextBlock({
      column: 1,
      margin: 4,
      stroke: "#ffffff",
      font: "600 13px Inter, system-ui, sans-serif",
      editable: true
    }, new go.Binding("text", "name").makeTwoWay()),
    new go.TextBlock({
      column: 2,
      margin: new go.Margin(4, 10, 4, 4),
      stroke: "#bfdbfe",
      font: "12px ui-monospace, SFMono-Regular, Menlo, monospace",
      alignment: go.Spot.Right,
      editable: true
    }, new go.Binding("text", "type").makeTwoWay())
  );
}

function makeSideResizeAdornment() {
  const handleStyle = {
    figure: "Rectangle",
    desiredSize: new go.Size(8, 28),
    fill: "#38bdf8",
    stroke: "#e0f2fe",
    strokeWidth: 1,
    cursor: "col-resize"
  };

  return new go.Adornment("Spot").add(
    new go.Placeholder(),
    new go.Shape(handleStyle, {
      alignment: go.Spot.Left,
      alignmentFocus: go.Spot.Right,
      name: "LEFT"
    }),
    new go.Shape(handleStyle, {
      alignment: go.Spot.Right,
      alignmentFocus: go.Spot.Left,
      name: "RIGHT"
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
    selectionAdorned: true,
    movable: true,
    resizable: true,
    resizeObjectName: "CARD",
    resizeAdornmentTemplate: makeSideResizeAdornment(),
    layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
    fromSpot: go.Spot.LeftRightSides,
    toSpot: go.Spot.LeftRightSides,
    cursor: "move",
    shadowVisible: true,
    shadowColor: "rgba(15, 23, 42, 0.25)",
    shadowOffset: new go.Point(0, 14),
    mouseEnter: (_, node) => {
      const shape = node.findObject("CARD");
      if (shape) {
        shape.stroke = "#f8fafc";
      }
    },
    mouseLeave: (_, node) => {
      const shape = node.findObject("CARD");
      if (shape) {
        shape.stroke = "rgba(226, 232, 240, 0.22)";
      }
    }
    },
    new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify)
  )
    .add(
      new go.Shape("RoundedRectangle", {
        name: "CARD",
        parameter1: 16,
        fill: "#0f172a",
        stroke: "rgba(226, 232, 240, 0.22)",
        strokeWidth: 1.5,
        minSize: new go.Size(220, NaN)
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
            minSize: new go.Size(180, 0)
          }).bind("fill", "color"),
          new go.TextBlock({
            stroke: "#eff6ff",
            font: "700 16px Inter, system-ui, sans-serif",
            editable: false,
            width: 156,
            margin: new go.Margin(10, 12, 10, 12),
            wrap: go.TextBlock.None,
            overflow: go.TextBlock.OverflowClip,
            textAlign: "center"
          }).bind("text", "name")
        ),
        new go.Panel("Table", {
          name: "FIELDS",
          padding: new go.Margin(8, 0, 10, 0),
          defaultColumnSeparatorStroke: "rgba(148, 163, 184, 0.15)",
          defaultRowSeparatorStroke: "rgba(148, 163, 184, 0.15)",
          itemTemplate: makeFieldTemplate()
        }).bind("itemArray", "fields")
      )
    );
}

function createLinkTemplate() {
  return new go.Link({
    routing: go.Link.AvoidsNodes,
    curve: go.Link.JumpGap,
    corner: 10,
    relinkableFrom: true,
    relinkableTo: true,
    reshappable: true,
    resegmentable: true
  }).add(
    new go.Shape({
      stroke: "#94a3b8",
      strokeWidth: 2.2
    }),
    new go.Shape({
      toArrow: "Standard",
      fill: "#94a3b8",
      stroke: null,
      scale: 1.1
    }),
    new go.Panel("Auto", {
      segmentIndex: NaN,
      segmentFraction: 0.5
    }).add(
      new go.Shape("RoundedRectangle", {
        fill: "#e2e8f0",
        strokeWidth: 0
      }),
      new go.TextBlock({
        margin: new go.Margin(4, 8, 4, 8),
        stroke: "#0f172a",
        font: "700 11px ui-monospace, SFMono-Regular, Menlo, monospace",
        editable: true
      }, new go.Binding("text", "text").makeTwoWay())
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
