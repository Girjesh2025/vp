const d3 = require('d3-hierarchy');
const root = d3.hierarchy({
  name: "root",
  children: [
    { name: "A", children: [{name: "A1", value: 100}, {name: "A2", value: 300}] },
    { name: "B", children: [{name: "B1", value: 200}] }
  ]
}).sum(d => d.value)
  .sort((a, b) => b.value - a.value);

const treemap = d3.treemap().size([1000, 600]).paddingOuter(20).paddingInner(2).round(true);
treemap(root);
console.log(root.children[0].x0, root.children[0].x1);
