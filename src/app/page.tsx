"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronRight, ChevronDown, Copy, Search, Info, HardDrive, Activity, CheckCircle2 } from "lucide-react";
import { MqttConfigComponent } from './mqtt-config';
import { MqttStats } from './mqtt-hook';
import { convertMqttToUnsNodes } from './mqtt-to-uns';

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
  const topics: CompactTopic[] = leaves.map((n) => {
    const topic: CompactTopic = { 
      path: n.path, 
      type: n.type, 
      template: n.template, 
      estMps: n.estMps 
    };
    // Only include description if it exists and is not auto-generated
    if (n.description && !n.description.includes('Real-time topic with')) {
      topic.description = n.description;
    }
    return topic;
  });
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
const TotalsBar = ({ allLeaves, mqttStats }: { allLeaves: Node[], mqttStats?: MqttStats | null }) => {
  const totals = useMemo(() => {
    const sum = (t?: TopicType) => allLeaves.filter((n) => n.type && (!t || n.type === t)).reduce((acc, n) => acc + (n.estMps || 0), 0);
    return { metrics: sum("metrics"), others: sum("state") + sum("action"), all: sum(undefined) };
  }, [allLeaves]);

  const isLiveData = mqttStats?.connected || false;

  return (
    <Card>
      <div className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-600"/>
          <span className="text-sm text-gray-600">Metrics</span>
          <span className="font-mono text-lg font-bold text-indigo-700">{totals.metrics.toFixed(3)} msg/s</span>
          {isLiveData && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LIVE</span>}
        </div>
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-600"/>
          <span className="text-sm text-gray-600">State/Action</span>
          <span className="font-mono text-lg font-bold text-slate-700">{totals.others.toFixed(3)} msg/s</span>
          {isLiveData && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LIVE</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Info className="w-4 h-4 text-gray-500"/>
          <span className="text-sm text-gray-600">Total</span>
          <span className="font-mono text-lg font-bold text-gray-800">{totals.all.toFixed(3)} msg/s</span>
          {isLiveData && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LIVE</span>}
        </div>
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
  const [showTopicTypes, setShowTopicTypes] = useState(true);
  const [showExportImport, setShowExportImport] = useState(false);
  const [mqttStats, setMqttStats] = useState<MqttStats | null>(null);

  const [exportText, setExportText] = useState<string>(JSON.stringify(toCompact(initialDATA), null, 2));
  const [importText, setImportText] = useState<string>(JSON.stringify(toCompact(initialDATA), null, 2));

  // Use MQTT data when connected, otherwise use static data
  const currentData = useMemo(() => {
    if (!mqttStats || !mqttStats.connected) {
      return data;
    }
    
    // When MQTT is connected, rebuild the tree from MQTT data only
    return convertMqttToUnsNodes(mqttStats);
  }, [data, mqttStats]);

  const allLeaves = useMemo(() => collectLeaves(currentData).filter((n) => n.type), [currentData]);
  const allNodes = useMemo(() => flatten(currentData), [currentData]);

  useEffect(() => {
    const firstLeaf = allLeaves.find(Boolean);
    setSelected(firstLeaf);
  }, [allLeaves]);


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

        {/* MQTT Live Connection */}
        <div className="mb-6">
          <MqttConfigComponent onStatsUpdate={setMqttStats} />
        </div>


        {/* Copy/Paste Import/Export - Collapsible */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
            onClick={() => setShowExportImport(!showExportImport)}
          >
            <div className="flex items-center justify-between">
              <SectionTitle>Export / Import</SectionTitle>
              {showExportImport ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
          {showExportImport && (
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <SectionTitle>Export (full JSON)</SectionTitle>
                <div className="mt-2">
                  <button 
                    onClick={() => {
                      const exportData = toCompact(currentData);
                      setExportText(JSON.stringify(exportData, null, 2));
                    }}
                    className="w-full px-4 py-3 text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4"/>
                    生成当前Namespace Tree的完整JSON
                  </button>
                  {exportText && (
                    <div className="mt-3">
                      <textarea
                        className="w-full h-64 font-mono text-sm border border-gray-300 rounded-xl p-4 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 focus:bg-white transition-colors"
                        value={exportText}
                        readOnly
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => copyToClipboard(exportText)} className="px-3 py-1.5 text-sm border border-indigo-200 text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 transition-colors inline-flex items-center gap-1"><Copy className="w-4 h-4"/>Copy</button>
                        <span className="text-xs text-gray-600 font-medium">Format: {`{"version":"v1","topics":[{"path","type","template"}]}`}</span>
                      </div>
                    </div>
                  )}
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
          )}
        </Card>

        <SelfTestPanel root={data} />
        
        <TotalsBar allLeaves={allLeaves} mqttStats={mqttStats} />

        {/* Layout */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            {/* Search Controls */}
            <div className="mb-3 flex flex-wrap items-center gap-3">
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
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <TypeBadge type="metrics" />
                <TypeBadge type="state" />
                <TypeBadge type="action" />
              </div>
            </div>
            
            <Card className="overflow-hidden">
              <div className="border-b p-3 px-4 flex items-center justify-between">
                <SectionTitle>Namespace Tree</SectionTitle>
                <div className="flex items-center gap-2">
                  <Pill>{allLeaves.length} namespaces</Pill>
                  <button onClick={expandAll} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-blue-200 text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-colors"><ChevronDown className="w-4 h-4"/>Expand</button>
                  <button onClick={collapseAll} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-orange-200 text-orange-700 bg-orange-50 rounded-xl hover:bg-orange-100 hover:border-orange-300 transition-colors"><ChevronRight className="w-4 h-4"/>Collapse</button>
                </div>
              </div>
              <div className="max-h-[70vh] overflow-auto p-2">
                <TreeNode
                  node={currentData}
                  level={0}
                  expanded={expanded}
                  onToggle={toggle}
                  onSelect={setSelected}
                  selectedId={selected?.id}
                  search={search}
                />
              </div>
            </Card>
          </div>

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

        {/* UNS Topic Types and Standard - Always Expanded */}
        <Card className="overflow-hidden mt-6">
          <div className="p-4">
            <SectionTitle>UNS Topic Types & Standard</SectionTitle>
          </div>
          <div className="p-4 pt-0">
            {/* UNS Standard Definition */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-3">UNS Standard Definition</h4>
              <div className="text-xs text-blue-700 space-y-3">
                <p>
                  <strong>Unified Namespace (UNS)</strong> is an industrial data integration method centered around the MQTT protocol. Its objectives are:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>Semantic Clarity & Readability:</strong> Through simple standards, data is given clear meaning, making it easy to understand and use.</li>
                  <li><strong>Single Source of Truth:</strong> Provides unified access to all data sources within an organization.</li>
                  <li><strong>Event-Driven Architecture:</strong> Uses publish/subscribe mechanisms to replace polling as much as possible, improving real-time performance and efficiency.</li>
                </ul>
              </div>
            </div>

            {/* UNS Components */}
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <h4 className="text-sm font-semibold text-green-800 mb-3">UNS Components</h4>
              <div className="text-xs text-green-700 space-y-3">
                <p>UNS consists of <strong>Namespace</strong> and <strong>Message Broker</strong>:</p>
                
                <div>
                  <h5 className="font-semibold mb-2">Namespace</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>Tree Structure:</strong> Multi-level URI tree structure using UTF-8 encoded natural language, reflecting hierarchical relationships between data sources. Each node is called a namespace.</li>
                    <li><strong>Key-Value Data:</strong> Leaf nodes carry data, expressed as key-value pairs using JSON. Prefer shallow, non-array JSON structures for parsing efficiency and compatibility.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold mb-2">Message Broker</h5>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Responsible for carrying namespace structure and data content. Recommend using MQTT v3.1/v5 compatible brokers for lighter architecture.</li>
                    <li><strong>Namespace to Topic Mapping:</strong> Maps namespaces to MQTT topics.</li>
                    <li><strong>Bidirectional Data Distribution:</strong> All data sources and consumers subscribe to the broker as MQTT clients.</li>
                    <li><strong>Storage Layer Writing:</strong> Message broker is the sole data source for storage layer. Frontend/backend should not directly operate storage layer (database).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Namespace Construction Rules */}
            <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <h4 className="text-sm font-semibold text-amber-800 mb-3">Namespace Construction Rules</h4>
              <div className="text-xs text-amber-700 space-y-3">
                <p>Follow the pattern: <code className="bg-amber-100 px-1 rounded">Version/Site/Function/Station/State|Action|Info|Metrics/topic</code> (similar to ISA95), or from another perspective: <code className="bg-amber-100 px-1 rounded">{`{Business Domain}/{Entity Class}/{Entity ID}/State|Action|Info|Metrics/topic`}</code></p>
                
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Use human-readable abbreviations (English preferred)</li>
                  <li>Maximum 7 levels to ensure performance and maintainability</li>
                  <li>For large numbers of frequent entity IDs, they should be implicitly recorded in payload to avoid topic explosion</li>
                </ul>

                <div>
                  <p className="font-semibold mb-1">Examples:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><code className="bg-amber-100 px-1 rounded">Fuyang/Warehouse/STG1/AGV/AGV1/Action/Startup/</code></li>
                    <li><code className="bg-amber-100 px-1 rounded">brew/material/MALT-001/Action/inbound</code></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Topic Types */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Topic Types</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                  <TypeBadge type="state" />
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-green-800 mb-1">State</h5>
                    <p className="text-xs text-green-700 leading-relaxed mb-2">
                      System current state
                    </p>
                    <div className="text-xs text-green-600">
                      <p className="font-semibold mb-1">Publisher:</p>
                      <p className="mb-1">Authenticated external systems/eventflow</p>
                      <p className="font-semibold mb-1">Subscriber:</p>
                      <p className="mb-1">BIS App UI/eventflow</p>
                      <p className="font-mono mt-1">e.g.: device/T01/state/isRunning</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <TypeBadge type="action" />
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-amber-800 mb-1">Action</h5>
                    <p className="text-xs text-amber-700 leading-relaxed mb-2">
                      Interface layer, triggers system actions
                    </p>
                    <div className="text-xs text-amber-600">
                      <p className="font-semibold mb-1">Publisher:</p>
                      <p className="mb-1">BIS App UI/authenticated external systems/eventflow</p>
                      <p className="font-semibold mb-1">Subscriber:</p>
                      <p className="mb-1">eventflow</p>
                      <p className="font-mono mt-1">e.g.: device/T01/action/start</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                  <TypeBadge type="metrics" />
                  <div className="flex-1">
                    <h5 className="text-sm font-semibold text-indigo-800 mb-1">Metrics</h5>
                    <p className="text-xs text-indigo-700 leading-relaxed mb-2">
                      Time-series data
                    </p>
                    <div className="text-xs text-indigo-600">
                      <p className="font-semibold mb-1">Publisher:</p>
                      <p className="mb-1">Authenticated devices/time-series data sources/sourceflow</p>
                      <p className="font-semibold mb-1">Subscriber:</p>
                      <p className="mb-1">BIS App UI/authenticated external systems/eventflow</p>
                      <p className="font-mono mt-1">e.g.: device/T01/metrics/temperature</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                <strong>Note:</strong> Topic types should be explicitly indicated in the second-to-last level of the Topic path.
              </p>
            </div>
            
            {/* JSON Format Specification */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">JSON Format Specification</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-700 mb-2 font-medium">Interactive Browser accepts JSON in the following format:</p>
                  <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-x-auto">
{`{
  "version": "v1",
  "topics": [
    {
      "path": "v1/FY-Fab/erp/state/order-registry",
      "type": "state",
      "estMps": 0.03,
      "description": "ERP publishes current open orders registry",
      "template": {
        "op": "upsert",
        "order_id": "PO-202507-0001",
        "product_id": "P-M6",
        "qty": 5000
      }
    }
  ]
}`}
                  </pre>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Required Fields:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li><code className="bg-gray-200 px-1 rounded">version</code> - Schema version (string)</li>
                      <li><code className="bg-gray-200 px-1 rounded">topics</code> - Array of topic objects</li>
                      <li><code className="bg-gray-200 px-1 rounded">path</code> - Full UNS path (string)</li>
                      <li><code className="bg-gray-200 px-1 rounded">type</code> - Topic type: &quot;state&quot;, &quot;action&quot;, or &quot;metrics&quot;</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-2">Optional Fields:</h5>
                    <ul className="space-y-1 text-gray-700">
                      <li><code className="bg-gray-200 px-1 rounded">estMps</code> - Estimated messages per second (number)</li>
                      <li><code className="bg-gray-200 px-1 rounded">description</code> - Human-readable description (string)</li>
                      <li><code className="bg-gray-200 px-1 rounded">template</code> - Example payload (object)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-gray-300">
                  <p className="text-xs text-gray-600">
                    <strong>Note:</strong> The browser will automatically build the namespace tree from the <code className="bg-gray-200 px-1 rounded">path</code> field of each topic. 
                    Use the Import/Export section above to paste or copy JSON data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
