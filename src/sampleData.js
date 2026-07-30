export const initialModel = {
  nodeDataArray: [
    {
      key: "users",
      name: "users",
      color: "#1d4ed8",
      loc: "-40 -30",
      fields: [
        { name: "id", type: "uuid", pk: true, nullable: false },
        { name: "email", type: "varchar(255)", unique: true, nullable: false },
        { name: "full_name", type: "varchar(120)", nullable: false },
        { name: "created_at", type: "timestamp", nullable: false }
      ]
    },
    {
      key: "orders",
      name: "orders",
      color: "#0f766e",
      loc: "280 20",
      fields: [
        { name: "id", type: "uuid", pk: true, nullable: false },
        { name: "user_id", type: "uuid", fk: true, nullable: false },
        { name: "status", type: "varchar(32)", nullable: false },
        { name: "submitted_at", type: "timestamp", nullable: true }
      ]
    },
    {
      key: "order_items",
      name: "order_items",
      color: "#b45309",
      loc: "290 250",
      fields: [
        { name: "id", type: "uuid", pk: true, nullable: false },
        { name: "order_id", type: "uuid", fk: true, nullable: false },
        { name: "sku", type: "varchar(64)", nullable: false },
        { name: "quantity", type: "int", nullable: false }
      ]
    }
  ],
  linkDataArray: [
    {
      key: -1,
      from: "users",
      to: "orders",
      text: "1:N",
      fromCardinality: "1",
      toCardinality: "N"
    },
    {
      key: -2,
      from: "orders",
      to: "order_items",
      text: "1:N",
      fromCardinality: "1",
      toCardinality: "N"
    }
  ]
};

export const paletteItems = [
  {
    key: "customers",
    name: "customers",
    color: "#7c3aed",
    fields: [
      { name: "id", type: "uuid", pk: true, nullable: false },
      { name: "name", type: "varchar(160)", nullable: false },
      { name: "created_at", type: "timestamp", nullable: false }
    ]
  },
  {
    key: "payments",
    name: "payments",
    color: "#be123c",
    fields: [
      { name: "id", type: "uuid", pk: true, nullable: false },
      { name: "order_id", type: "uuid", fk: true, nullable: false },
      { name: "amount", type: "decimal(10,2)", nullable: false }
    ]
  }
];
