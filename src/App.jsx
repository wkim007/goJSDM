import { useEffect, useRef, useState } from "react";
import go from "gojs";
import { ReactDiagram, ReactOverview, ReactPalette } from "gojs-react";
import { initialModel, paletteItems } from "./sampleData";

const GOJS_LICENSE_KEY =
  "298647e1b16248c702d90776423d68f919a175639d841aa30a0413f3ec086106329ee02850d38d93dbac1efe1f79c4d1dbc03a20c748023dee3181d94be1d4a9e53326e6140a4e8df60b7496c9ff29b3ec7e24a2c4b525f2db6a9cf1eaabc18355f7f1";

go.Diagram.licenseKey = GOJS_LICENSE_KEY;

const emptySelection = {
  key: "",
  name: "",
  color: "#2563eb",
  fields: []
};

function cloneModel() {
  return {
    nodeDataArray: structuredClone(initialModel.nodeDataArray),
    linkDataArray: structuredClone(initialModel.linkDataArray)
  };
}

function fieldBadges(field) {
  return [field.pk && "PK", field.fk && "FK", field.unique && "UQ", field.nullable ? "NULL" : "REQ"].filter(Boolean);
}

function makeFieldPanel() {
  return new go.Panel("TableRow", { defaultAlignment: go.Spot.Left }).add(
    new go.TextBlock(
      {
        column: 0,
        margin: new go.Margin(4, 8, 4, 10),
        stroke: "#dbeafe",
        font: "600 11px ui-monospace, SFMono-Regular, Menlo, monospace"
      }
    ).bind("text", "", (field) => fieldBadges(field).join(" ")),
    new go.TextBlock(
      {
        column: 1,
        margin: 4,
        stroke: "#ffffff",
        font: "600 13px Inter, system-ui, sans-serif"
      }
    ).bind("text", "name"),
    new go.TextBlock(
      {
        column: 2,
        margin: new go.Margin(4, 10, 4, 4),
        stroke: "#bfdbfe",
        font: "12px ui-monospace, SFMono-Regular, Menlo, monospace",
        alignment: go.Spot.Right
      }
    ).bind("text", "type")
  );
}

function initDiagram() {
  const diagram = new go.Diagram({
    "undoManager.isEnabled": true,
    "linkingTool.isUnconnectedLinkValid": false,
    "relinkingTool.isUnconnectedLinkValid": false,
    "linkingTool.portGravity": 20,
    "relinkingTool.portGravity": 20,
    "draggingTool.dragsLink": true,
    "commandHandler.copiesTree": false,
    "grid.visible": true,
    "grid.gridCellSize": new go.Size(20, 20),
    "toolManager.mouseWheelBehavior": go.WheelMode.Zoom,
    layout: new go.ForceDirectedLayout({
      defaultSpringLength: 120,
      defaultElectricalCharge: 140
    }),
    model: new go.GraphLinksModel({
      linkKeyProperty: "key"
    })
  });

  diagram.grid = new go.Panel("Grid").add(
    new go.Shape("LineH", { stroke: "rgba(148, 163, 184, 0.15)" }),
    new go.Shape("LineV", { stroke: "rgba(148, 163, 184, 0.15)" })
  );

  diagram.nodeTemplate = new go.Node("Auto", {
    locationSpot: go.Spot.Center,
    selectionAdorned: false,
    fromSpot: go.Spot.AllSides,
    toSpot: go.Spot.AllSides,
    fromLinkable: true,
    toLinkable: true,
    cursor: "move",
    shadowVisible: true,
    shadowColor: "rgba(15, 23, 42, 0.25)",
    shadowOffset: new go.Point(0, 14),
    mouseEnter: (_, node) => {
      const shape = node.findObject("CARD");
      if (shape) shape.stroke = "#f8fafc";
    },
    mouseLeave: (_, node) => {
      const shape = node.findObject("CARD");
      if (shape) shape.stroke = "rgba(226, 232, 240, 0.22)";
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
          itemTemplate: makeFieldPanel()
        }).bind("itemArray", "fields")
      )
    );

  diagram.linkTemplate = new go.Link({
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

  return diagram;
}

function initPalette() {
  return new go.Palette({
    "animationManager.isEnabled": false,
    nodeTemplateMap: initDiagram().nodeTemplateMap,
    model: new go.GraphLinksModel({
      linkKeyProperty: "key"
    })
  });
}

function initOverview() {
  return new go.Overview({
    contentAlignment: go.Spot.Center
  });
}

function App() {
  const diagramRef = useRef(null);
  const [model, setModel] = useState(cloneModel);
  const [selectedNode, setSelectedNode] = useState(emptySelection);
  const [schemaJson, setSchemaJson] = useState("");
  const [skipsDiagramUpdate, setSkipsDiagramUpdate] = useState(false);

  useEffect(() => {
    setSchemaJson(JSON.stringify(model, null, 2));
  }, [model]);

  const syncSelection = () => {
    const diagram = diagramRef.current?.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;
    const part = diagram.selection.first();
    if (part instanceof go.Node && part.data) {
      setSelectedNode(structuredClone(part.data));
      return;
    }
    setSelectedNode(emptySelection);
  };

  const handleModelChange = () => {
    const diagram = diagramRef.current?.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;
    const nextModel = {
      nodeDataArray: diagram.model.nodeDataArray.map((node) => structuredClone(node)),
      linkDataArray: diagram.model.linkDataArray.map((link) => structuredClone(link))
    };
    setSkipsDiagramUpdate(true);
    setModel(nextModel);
    syncSelection();
  };

  useEffect(() => {
    const diagram = diagramRef.current?.getDiagram();
    if (!(diagram instanceof go.Diagram)) return undefined;
    const listener = () => syncSelection();
    diagram.addDiagramListener("ChangedSelection", listener);
    return () => diagram.removeDiagramListener("ChangedSelection", listener);
  }, []);

  useEffect(() => {
    if (skipsDiagramUpdate) {
      setSkipsDiagramUpdate(false);
    }
  }, [skipsDiagramUpdate]);

  const addEntity = () => {
    const timestamp = Date.now();
    const newEntity = {
      key: `table_${timestamp}`,
      name: `new_table_${model.nodeDataArray.length + 1}`,
      color: "#2563eb",
      loc: `${80 + model.nodeDataArray.length * 30} ${80 + model.nodeDataArray.length * 30}`,
      fields: [
        { name: "id", type: "uuid", pk: true, nullable: false },
        { name: "created_at", type: "timestamp", nullable: false }
      ]
    };
    setModel((current) => ({
      ...current,
      nodeDataArray: [...current.nodeDataArray, newEntity]
    }));
    setSelectedNode(newEntity);
  };

  const autoLayout = () => {
    const diagram = diagramRef.current?.getDiagram();
    if (!(diagram instanceof go.Diagram)) return;
    diagram.startTransaction("auto layout");
    diagram.layoutDiagram(true);
    diagram.commitTransaction("auto layout");
  };

  const resetModel = () => {
    setModel(cloneModel());
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
          <ReactPalette
            initPalette={initPalette}
            divClassName="palette-component"
            nodeDataArray={paletteItems}
          />
        </div>

        <div className="panel compact">
          <div className="panel-header">
            <p className="eyebrow">Navigation</p>
            <h2>Overview</h2>
          </div>
          <ReactOverview initOverview={initOverview} divClassName="overview-component" observedDiagram={diagramRef.current?.getDiagram()} />
        </div>
      </aside>

      <main className="workspace">
        <section className="hero">
          <div>
            <p className="eyebrow">GoJS + React Sample</p>
            <h1>Data modeler for table design and relationships</h1>
            <p className="hero-copy">
              Drag starter tables from the palette, rename columns directly in the canvas, and connect tables to sketch one-to-many relationships.
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
          <ReactDiagram
            ref={diagramRef}
            initDiagram={initDiagram}
            divClassName="diagram-component"
            nodeDataArray={model.nodeDataArray}
            linkDataArray={model.linkDataArray}
            onModelChange={handleModelChange}
            skipsDiagramUpdate={skipsDiagramUpdate}
          />
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
