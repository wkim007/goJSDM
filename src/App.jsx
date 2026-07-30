import React, { useEffect, useRef, useState } from "react";
import go from "../release/go-module.js";
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
    }).bindTwoWay("text", "name"),
    new go.TextBlock({
      column: 2,
      margin: new go.Margin(4, 10, 4, 4),
      stroke: "#bfdbfe",
      font: "12px ui-monospace, SFMono-Regular, Menlo, monospace",
      alignment: go.Spot.Right,
      editable: true
    }).bindTwoWay("text", "type")
  );
}

function createNodeTemplate() {
  return new go.Node("Auto", {
    locationSpot: go.Spot.Center,
    selectionAdorned: false,
    resizable: true,
    fromSpot: go.Spot.LeftRightSides,
    toSpot: go.Spot.LeftRightSides,
    fromLinkable: true,
    toLinkable: true,
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
  })
    .bindTwoWay("location", "loc", go.Point.parse, go.Point.stringify)
    .add(
      new go.Shape("RoundedRectangle", {
        name: "CARD",
        parameter1: 16,
        fill: "#0f172a",
        stroke: "rgba(226, 232, 240, 0.22)",
        strokeWidth: 1.5
      }),
      new go.Panel("Vertical", { stretch: go.Stretch.Fill }).add(
        new go.Panel("Auto", { stretch: go.Stretch.Horizontal }).add(
          new go.Shape("RoundedRectangle", {
            parameter1: 16,
            strokeWidth: 0,
            stretch: go.Stretch.Fill
          }).bind("fill", "color"),
          new go.Panel("Horizontal", { margin: new go.Margin(10, 12, 10, 12) }).add(
            new go.TextBlock({
              stroke: "#eff6ff",
              font: "700 16px Inter, system-ui, sans-serif",
              editable: true
            }).bindTwoWay("text", "name")
          )
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
    routing: go.Routing.AvoidsNodes,
    curve: go.Curve.JumpGap,
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
      }).bindTwoWay("text", "text")
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

  const [model, setModel] = useState(() => cloneModel());
  const [selectedNode, setSelectedNode] = useState(emptySelection);
  const [schemaJson, setSchemaJson] = useState(() => JSON.stringify(initialModel, null, 2));

  useEffect(() => {
    const updateSelection = () => {
      const diagram = diagramRef.current;
      if (!(diagram instanceof go.Diagram)) {
        return;
      }
      const part = diagram.selection.first();
      if (part instanceof go.Node && part.data) {
        setSelectedNode(structuredClone(part.data));
        return;
      }
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
      "undoManager.isEnabled": true,
      "linkingTool.isUnconnectedLinkValid": false,
      "relinkingTool.isUnconnectedLinkValid": false,
      "linkingTool.portGravity": 20,
      "relinkingTool.portGravity": 20,
      "commandHandler.copiesTree": false,
      "grid.visible": true,
      "grid.gridCellSize": new go.Size(20, 20),
      "toolManager.mouseWheelBehavior": go.WheelMode.Zoom,
      layout: new go.ForceDirectedLayout({
        defaultSpringLength: 120,
        defaultElectricalCharge: 140
      })
    });

    diagram.grid = new go.Panel("Grid").add(
      new go.Shape("LineH", { stroke: "rgba(148, 163, 184, 0.15)" }),
      new go.Shape("LineV", { stroke: "rgba(148, 163, 184, 0.15)" })
    );
    diagram.nodeTemplate = createNodeTemplate();
    diagram.linkTemplate = createLinkTemplate();

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
    diagram.addModelChangedListener((event) => {
      if (event.isTransactionFinished) {
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
    diagram.startTransaction("auto layout");
    diagram.layoutDiagram(true);
    diagram.commitTransaction("auto layout");
  };

  const resetModel = () => {
    applyModelToDiagram(cloneModel());
    setSelectedNode(emptySelection);
  };

  return (
    <div className="app-shell">
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
      </aside>
    </div>
  );
}

export default App;
