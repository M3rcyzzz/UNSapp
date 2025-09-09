"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Copy, Search, Info, HardDrive, Activity, CheckCircle2 } from "lucide-react";

// ---------- Helper UI bits ----------
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 border border-gray-200 text-gray-700">{children}</span>
);

const TypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, string> = {
    metrics: "bg-indigo-50 text-indigo-700 border-indigo-200",
    state: "bg-green-50 text-green-700 border-green-200",
    action: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${map[type] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
      {type}
    </span>
  );
};

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>{children}</div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-gray-700 tracking-wide">{children}</h3>
);

// ---------- Data Model ----------
export type TopicType = "metrics" | "state" | "action";

export type Node = {
  id: string;
  name: string; // label at this level
  path: string; // full UNS path
  type?: TopicType; // only on leaf topics
  estMps?: number; // estimated messages per second
  template?: Record<string, unknown>; // shallow JSON example payload
  description?: string; // human description
  children?: Node[];
};

// ---------- Import UNS Export Data ----------
import unsExportData from './uns_export.json';
import type { UnsExportData } from './types';

// ---------- Convert JSON to Node Structure ----------
const convertJsonToNode = (jsonData: UnsExportData): Node => {
  const rootMap = new Map<string, Node>();
  
  const ensureNode = (path: string): Node => {
    if (rootMap.has(path)) return rootMap.get(path)!;
    
    const segs = path.split("/");
    const id = segs[segs.length - 1];
    const name = id;
    const node: Node = { id: path, name, path };
    rootMap.set(path, node);
    
    // Link to parent
    if (segs.length > 1) {
      const parentPath = segs.slice(0, -1).join("/");
      const parent = ensureNode(parentPath);
      parent.children = parent.children || [];
      if (!parent.children.find((c) => c.path === path)) {
        parent.children.push(node);
      }
    }
    return node;
  };

  // Process all topics
  jsonData.topics.forEach((topic) => {
    const node = ensureNode(topic.path);
    node.type = topic.type as TopicType;
    node.template = topic.template;
    node.estMps = topic.estMps;
    node.description = topic.description;
  });

  // Return root node
  const rootPath = "v1/FY-Fab";
  return rootMap.get(rootPath) || { id: "root", name: "FY-Fab", path: "v1/FY-Fab", children: [] };
};

// ---------- Initial Dataset (from JSON) ----------
const initialDATA: Node = convertJsonToNode(unsExportData);

// ---------- Utilities ----------
const collectLeaves = (n: Node): Node[] => {
  if (!n.children || n.children.length === 0) return [n];
  return n.children.flatMap(collectLeaves);
};

const flatten = (n: Node): Node[] => {
  const arr: Node[] = [n];
  if (n.children) n.children.forEach((c) => arr.push(...flatten(c)));
  return arr;
};

const formatMps = (v?: number) => (v == null ? "—" : `${v.toFixed(3)} msg/s`);

const copyToClipboard = async (text: string) => {
  try { await navigator.clipboard.writeText(text); } catch {}
};

// ---------- Search Helpers ----------
const matchesSearch = (node: Node, q: string) => {
  if (!q) return true;
  const s = q.toLowerCase();
  return node.name.toLowerCase().includes(s) || node.path.toLowerCase().includes(s) || (node.description || "").toLowerCase().includes(s);
};

const hasDescendantMatch = (node: Node, q: string): boolean => {
  if (!q) return true;
  if (matchesSearch(node, q)) return true;
  return (node.children || []).some((c) => hasDescendantMatch(c, q));
};

// ---------- Compact Import / Export (copy/paste) ----------
// Export format kept *minimal*: only leaf topics
// {"version":"v1","topics":[{"path":"...","type":"state","template":{...}}]}

type CompactTopic = { path: string; type?: TopicType; template?: Record<string, unknown>; estMps?: number; description?: string };

type CompactDoc = { version: string; topics: CompactTopic[] };

const toCompact = (root: Node): CompactDoc => {
  const leaves = collectLeaves(root).filter((n) => n.type);
  const topics: CompactTopic[] = leaves.map((n) => ({ path: n.path, type: n.type, template: n.template, estMps: n.estMps, description: n.description }));
  return { version: "v1", topics };
};

// Build a tree from compact topics
const fromCompact = (doc: CompactDoc): Node => {
  const rootMap = new Map<string, Node>();
  const ensureNode = (path: string): Node => {
    if (rootMap.has(path)) return rootMap.get(path)!;
    const segs = path.split("/");
    const id = segs[segs.length - 1];
    const name = id;
    const node: Node = { id: path, name, path };
    rootMap.set(path, node);
    // link to parent
    if (segs.length > 1) {
      const parentPath = segs.slice(0, -1).join("/");
      const parent = ensureNode(parentPath);
      parent.children = parent.children || [];
      if (!parent.children.find((c) => c.path === path)) parent.children.push(node);
    }
    return node;
  };

  doc.topics.forEach((t) => {
    const node = ensureNode(t.path);
    node.type = t.type;
    node.template = t.template;
    node.estMps = t.estMps;
    node.description = t.description;
  });

  // If paths are absolute like v1/FY-Fab/..., the root is the first segment (e.g., "v1")
  const firstSeg = doc.topics[0]?.path?.split("/")[0] || "root";
  return rootMap.get(firstSeg) || { id: "root", name: "root", path: "root", children: [...rootMap.values()] };
};

// ---------- Dev Self Tests (runtime) ----------
function runSelfTests(root: Node) {
  const leaves = collectLeaves(root).filter((n) => n.type);
  const allNodes = flatten(root);
  const results: { name: string; pass: boolean; detail?: string }[] = [];

  // 1) penultimate segment equals declared type
  const t1 = leaves.every((n) => n.path.split("/").slice(-2, -1)[0] === n.type);
  results.push({ name: "Penultimate matches node.type", pass: t1 });

  // 2) path depth <= 7 segments
  const t2 = allNodes.every((n) => n.path.split("/").length <= 7);
  results.push({ name: "Path depth ≤ 7", pass: t2 });

  // 3) templates shallow (no arrays at top level)
  const t3 = leaves.every((n) => !n.template || !Object.values(n.template).some((v) => Array.isArray(v)));
  results.push({ name: "Template shallow (no arrays)", pass: t3 });


  // 5) export→import roundtrip keeps leaf count
  const compact = toCompact(root);
  const rebuilt = fromCompact(compact);
  const t5 = collectLeaves(root).filter((n) => n.type).length === collectLeaves(rebuilt).filter((n) => n.type).length;
  results.push({ name: "Export/Import roundtrip leaf count", pass: t5 });

  // 6) All leaf types are valid
  const validTypes: TopicType[] = ["metrics", "state", "action"];
  const t6 = leaves.every((n) => validTypes.includes(n.type!));
  results.push({ name: "Leaf types valid", pass: t6 });

  return results;
}

const SelfTestPanel = ({ root }: { root: Node }) => {
  const tests = useMemo(() => runSelfTests(root), [root]);
  const allPass = tests.every((t) => t.pass);
  return (
    <Card>
      <div className="p-3 flex items-center gap-3">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${allPass ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
          <CheckCircle2 className="w-3.5 h-3.5" /> {allPass ? "All self-tests passed" : "Some tests failed"}
        </span>
        <div className="text-xs text-gray-600 flex flex-wrap gap-2">
          {tests.map((t, i) => (
            <span key={i} className={`px-1.5 py-0.5 rounded-md border ${t.pass ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>{t.name}{t.detail ? ` (${t.detail})` : ""}</span>
          ))}
        </div>
      </div>
    </Card>
  );
};

// ---------- Tree ----------
const TreeNode = ({ node, level, expanded, onToggle, onSelect, selectedId, search }: {
  node: Node;
  level: number;
  expanded: Record<string, boolean>;
  onToggle: (id: string) => void;
  onSelect: (node: Node) => void;
  selectedId?: string;
  search: string;
}) => {
  const isLeaf = !node.children || node.children.length === 0;
  const isOpen = expanded[node.id] || false;
  if (!hasDescendantMatch(node, search)) return null;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-50 ${selectedId === node.id ? "bg-indigo-50" : ""}`}
        style={{ paddingLeft: level * 14 }}
        onClick={() => (isLeaf ? onSelect(node) : onToggle(node.id))}
      >
        {isLeaf ? <span className="w-4" /> : (isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />)}
        <span className="text-sm font-medium text-gray-800">{node.name}</span>
        {node.type && <TypeBadge type={node.type} />}
        {node.type && <span className="text-[10px] text-gray-500">{formatMps(node.estMps)}</span>}
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} level={level + 1} expanded={expanded} onToggle={onToggle} onSelect={onSelect} selectedId={selectedId} search={search} />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Right Panel ----------
const Details = ({ node }: { node?: Node }) => {
  if (!node) return <div className="h-full flex items-center justify-center text-gray-400 text-sm">Select a topic from the tree.</div>;
  const penultimate = node.path.split("/").slice(-2, -1)[0];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-xs text-gray-500">UNS Path</div>
          <div className="font-mono text-sm text-gray-900 break-words">{node.path}</div>
        </div>
        <div className="flex items-center gap-2">
          {node.type && <TypeBadge type={node.type} />}
          <button onClick={() => copyToClipboard(node.path)} className="inline-flex items-center gap-1 px-2 py-1 text-xs border rounded-md hover:bg-gray-50"><Copy className="w-3.5 h-3.5" /> Copy</button>
        </div>
      </div>

      {node.description && (
        <Card><div className="p-4"><SectionTitle>Description</SectionTitle><p className="text-sm text-gray-700 mt-1">{node.description}</p></div></Card>
      )}

      <Card>
        <div className="p-4 space-y-1">
          <SectionTitle>Topic Type</SectionTitle>
          <div className="flex items-center gap-2 text-sm">
            <Pill>{penultimate}</Pill>
            {node.type && <Pill>leaf: {node.type}</Pill>}
            <Pill>MPS: {formatMps(node.estMps)}</Pill>
          </div>
        </div>
      </Card>

      {node.template && (
        <Card>
          <div className="p-4 space-y-2">
            <SectionTitle>Payload Template (JSON)</SectionTitle>
            <pre className="bg-gray-900 border border-gray-700 rounded-xl p-4 text-sm text-green-400 font-mono overflow-auto leading-relaxed shadow-inner">{JSON.stringify(node.template, null, 2)}</pre>
          </div>
        </Card>
      )}

      <Card>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div>
            <SectionTitle>Publishing</SectionTitle>
            <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
              {node.type === "metrics" && <li>Published by devices / sourceflow</li>}
              {node.type === "state" && <li>Published by eventflow services</li>}
              {node.type === "action" && <li>Published by eventflow HMIs/APIs</li>}
              {!node.type && <li>Folder level (no publisher)</li>}
            </ul>
          </div>
          <div>
            <SectionTitle>Subscribing</SectionTitle>
            <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
              {node.type === "metrics" && <li>Subscribed by BI dashboards / eventflow</li>}
              {(node.type === "state" || node.type === "action") && <li>Subscribed by eventflow microservices</li>}
              {!node.type && <li>Folder level (no subscriber)</li>}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ---------- Totals ----------
const TotalsBar = ({ allLeaves }: { allLeaves: Node[] }) => {
  const totals = useMemo(() => {
    const sum = (t?: TopicType) => allLeaves.filter((n) => n.type && (!t || n.type === t)).reduce((acc, n) => acc + (n.estMps || 0), 0);
    return { metrics: sum("metrics"), others: sum("state") + sum("action"), all: sum(undefined) };
  }, [allLeaves]);

  return (
    <Card>
      <div className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-600"/><span className="text-sm text-gray-600">Metrics</span><span className="font-mono text-lg font-bold text-indigo-700">{totals.metrics.toFixed(3)} msg/s</span></div>
        <div className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-slate-600"/><span className="text-sm text-gray-600">State/Action</span><span className="font-mono text-lg font-bold text-slate-700">{totals.others.toFixed(3)} msg/s</span></div>
        <div className="ml-auto flex items-center gap-2"><Info className="w-4 h-4 text-gray-500"/><span className="text-sm text-gray-600">Total</span><span className="font-mono text-lg font-bold text-gray-800">{totals.all.toFixed(3)} msg/s</span></div>
      </div>
    </Card>
  );
};

// ---------- Main ----------
// Helper function to get all node IDs for expansion
const getAllNodeIds = (node: Node): string[] => {
  const ids = [node.id];
  if (node.children) {
    node.children.forEach(child => {
      ids.push(...getAllNodeIds(child));
    });
  }
  return ids;
};

// Create expanded state with all nodes expanded
const createExpandedState = (rootNode: Node): Record<string, boolean> => {
  const allIds = getAllNodeIds(rootNode);
  const expanded: Record<string, boolean> = {};
  allIds.forEach(id => {
    expanded[id] = true;
  });
  return expanded;
};

export default function UNSInteractiveBrowser() {
  const [data, setData] = useState<Node>(initialDATA);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(createExpandedState(initialDATA));
  const [selected, setSelected] = useState<Node>();
  const [search, setSearch] = useState("");
  const [showTopicTypes, setShowTopicTypes] = useState(false);

  const [exportText, setExportText] = useState<string>(JSON.stringify(toCompact(initialDATA), null, 2));
  const [importText, setImportText] = useState<string>(JSON.stringify(toCompact(initialDATA), null, 2));

  const allLeaves = useMemo(() => collectLeaves(data).filter((n) => n.type), [data]);
  const allNodes = useMemo(() => flatten(data), [data]);

  useEffect(() => {
    const firstLeaf = allLeaves.find(Boolean);
    setSelected(firstLeaf);
  }, [allLeaves]);

  useEffect(() => {
    setExportText(JSON.stringify(toCompact(data), null, 2)); // keep full & up-to-date
  }, [data]);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    allNodes.forEach((n) => (all[n.id] = true));
    setExpanded(all);
  };
  const collapseAll = () => setExpanded({ root: true });

  const onImportFromPaste = () => {
    try {
      const json = JSON.parse(importText) as CompactDoc;
      const rebuilt = fromCompact(json);
      setData(rebuilt);
      setSelected(undefined);
    } catch {
      alert("Invalid JSON. Expected {version, topics[]} with leaf items.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">UNS Interactive Browser </h1>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
            <input
              placeholder="Search name/path/description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 border rounded-xl bg-white text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              style={{ width: 320 }}
            />
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
            <TypeBadge type="metrics" />
            <TypeBadge type="state" />
            <TypeBadge type="action" />
          </div>
        </div>

        {/* Copy/Paste Import/Export */}
        <Card>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <SectionTitle>Export (full JSON)</SectionTitle>
              <div className="mt-2">
                <textarea
                  className="w-full h-64 font-mono text-sm border border-gray-300 rounded-xl p-4 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:bg-white transition-colors"
                  value={exportText}
                  onChange={(e) => setExportText(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => copyToClipboard(exportText)} className="px-3 py-1.5 text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-colors inline-flex items-center gap-1"><Copy className="w-4 h-4"/>Copy</button>
                  <span className="text-xs text-gray-600 font-medium">Format: {`{"version":"v1","topics":[{"path","type","template"}]}`}</span>
                </div>
              </div>
            </div>
            <div>
              <SectionTitle>Import (paste JSON here)</SectionTitle>
              <div className="mt-2">
                <textarea
                  className="w-full h-64 font-mono text-sm border border-gray-300 rounded-xl p-4 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:bg-gray-50 transition-colors"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                />
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={onImportFromPaste} className="px-3 py-1.5 text-sm border border-green-200 text-green-700 bg-green-50 rounded-xl hover:bg-green-100 hover:border-green-300 transition-colors">Import from paste</button>
                  <span className="text-xs text-gray-600 font-medium">This will rebuild the tree from {`topics[].path`}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <SelfTestPanel root={data} />
        
        {/* Topic Types Description - Collapsible */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
            onClick={() => setShowTopicTypes(!showTopicTypes)}
          >
            <div className="flex items-center justify-between">
              <SectionTitle>UNS Topic Types</SectionTitle>
              {showTopicTypes ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
          {showTopicTypes && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <TypeBadge type="state" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-green-800 mb-1">State</h4>
                    <p className="text-xs text-green-700 leading-relaxed">
                      System current state, published by authenticated external systems/eventflow, subscribed by BIS App UI/eventflow
                    </p>
                    <p className="text-xs text-green-600 mt-1 font-mono">
                      e.g.: device/T01/state/isRunning
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <TypeBadge type="action" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-amber-800 mb-1">Action</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Interface layer, triggers system actions, published by BIS App UI/authenticated external systems/eventflow, subscribed by eventflow
                    </p>
                    <p className="text-xs text-amber-600 mt-1 font-mono">
                      e.g.: device/T01/action/start
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <TypeBadge type="metrics" />
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-indigo-800 mb-1">Metrics</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      Time-series data, published by authenticated devices/time-series data sources/sourceflow, subscribed by BIS App UI/authenticated external systems
                    </p>
                    <p className="text-xs text-indigo-600 mt-1 font-mono">
                      e.g.: device/T01/metrics/temperature
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
        
        <TotalsBar allLeaves={allLeaves} />

        {/* Layout */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card className="lg:col-span-5 overflow-hidden">
            <div className="border-b p-3 px-4 flex items-center justify-between">
              <SectionTitle>Namespace Tree</SectionTitle>
              <div className="flex items-center gap-2">
                <Pill>{allNodes.length} nodes</Pill>
                <button onClick={expandAll} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-blue-200 text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-colors"><ChevronDown className="w-4 h-4"/>Expand</button>
                <button onClick={collapseAll} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-orange-200 text-orange-700 bg-orange-50 rounded-xl hover:bg-orange-100 hover:border-orange-300 transition-colors"><ChevronRight className="w-4 h-4"/>Collapse</button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-auto p-2">
              <TreeNode
                node={data}
                level={0}
                expanded={expanded}
                onToggle={toggle}
                onSelect={setSelected}
                selectedId={selected?.id}
                search={search}
              />
            </div>
          </Card>

          <Card className="lg:col-span-7">
            <div className="border-b p-3 px-4 flex items-center justify-between">
              <SectionTitle>Topic Details</SectionTitle>
              {selected?.type && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Activity className="w-3.5 h-3.5"/>MPS</span>
                  <span className="font-mono">{formatMps(selected?.estMps)}</span>
                </div>
              )}
            </div>
            <Details node={selected} />
          </Card>
        </div>

        {/* Footer legend */}
        <div className="mt-6 text-xs text-gray-500">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">Legend:</span>
            <span className="inline-flex items-center gap-1"><Activity className="w-3.5 h-3.5"/>metrics → time-series DB</span>
            <span className="inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5"/>state/action → JSONB (transactional)</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>ID kept in payload to avoid topic explosion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
