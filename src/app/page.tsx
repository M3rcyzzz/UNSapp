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
    info: "bg-sky-50 text-sky-700 border-sky-200",
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
export type TopicType = "metrics" | "state" | "action" | "info";

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

// ---------- Initial Dataset (inline) ----------
const initialDATA: Node = {
  id: "root",
  name: "FY-Fab",
  path: "v1/FY-Fab",
  description: "Root node for FY-Fab factory namespace",
  children: [
    // ERP
    {
      id: "erp",
      name: "erp",
      path: "v1/FY-Fab/erp",
      description: "ERP integration domain for orders",
      children: [
        {
          id: "erp_site",
          name: "site",
          path: "v1/FY-Fab/erp/site",
          description: "Site-level grouping for ERP-fed states",
          children: [
            {
              id: "erp_order_registry",
              name: "order_registry",
              path: "v1/FY-Fab/erp/site/state/order_registry",
              type: "state",
              estMps: 0.03,
              description: "ERP publishes current open orders registry (upsert/delete by order).",
              template: {
                op: "upsert",
                order_id: "PO-202507-0001",
                product_id: "P-M6",
                qty: 5000,
                due_date: "2025-07-20",
                priority: 50,
                min_batch: 500,
                source: "ERP-A",
              },
            },
          ],
        },
      ],
    },
    // PLM
    {
      id: "plm",
      name: "plm",
      path: "v1/FY-Fab/plm",
      description: "Product lifecycle management (product master & routes)",
      children: [
        {
          id: "plm_site",
          name: "site",
          path: "v1/FY-Fab/plm/site",
          description: "Site-level grouping for PLM master data",
          children: [
            {
              id: "product_master",
              name: "product_master",
              path: "v1/FY-Fab/plm/site/info/product_master",
              type: "info",
              estMps: 0.005,
              description: "Master data of products including routing, default stations, mold needs and batch times.",
              template: {
                op: "upsert",
                product_id: "P-M6",
                name: "Hex Bolt M6",
                material_type: "wire",
                route_v: 3,
                route_step_1: "CUTWIRE",
                route_step_2: "COLD",
                route_step_3: "THREAD",
                route_step_4: "HT",
                default_station_1: "CUTWIRE1",
                default_station_2: "COLD1",
                default_station_3: "THREAD1",
                default_station_4: "HT1",
                mold_need_step_2: "MOLD-COLD-A",
                mold_need_step_3: "MOLD-THR-A",
                batch_time_min_step_2: 8,
                batch_time_min_step_3: 6,
                batch_time_min_step_4: 30,
              },
            },
          ],
        },
      ],
    },
    // TOOLING
    {
      id: "tool",
      name: "tool",
      path: "v1/FY-Fab/tool",
      description: "Mold and tooling info for setup & compatibility",
      children: [
        {
          id: "tool_site",
          name: "site",
          path: "v1/FY-Fab/tool/site",
          description: "Site-level grouping for tooling info",
          children: [
            {
              id: "mold_registry",
              name: "mold_registry",
              path: "v1/FY-Fab/tool/site/info/mold_registry",
              type: "info",
              estMps: 0.002,
              description: "Registry of all molds, usage limits and compatibility to stations/products.",
              template: {
                op: "upsert",
                mold_id: "MOLD-THR-A",
                for_function: "ch",
                for_station: "THREAD1",
                lifetime_cycles: 100000,
                compatible_products: "P-M6;P-M5",
              },
            },
            {
              id: "changeover_matrix",
              name: "changeover_matrix",
              path: "v1/FY-Fab/tool/site/info/changeover_matrix",
              type: "info",
              estMps: 0.001,
              description: "Matrix describing setup time when switching from one mold to another per station.",
              template: {
                function: "ch",
                station: "THREAD1",
                from_mold: "MOLD-THR-A",
                to_mold: "MOLD-THR-B",
                setup_time_min: 12,
              },
            },
          ],
        },
      ],
    },
    // WAREHOUSE
    {
      id: "wh",
      name: "wh",
      path: "v1/FY-Fab/wh",
      description: "Warehouse inventory snapshots and adjustments",
      children: [
        {
          id: "wh_site",
          name: "site",
          path: "v1/FY-Fab/wh/site",
          description: "Site-level grouping for warehouse state",
          children: [
            {
              id: "inventory_materials",
              name: "inventory_materials",
              path: "v1/FY-Fab/wh/site/state/inventory_materials",
              type: "state",
              estMps: 0.05,
              description: "Real-time material inventory levels in warehouse (onhand/allocated).",
              template: {
                material_id: "WIRE-6MM",
                uom: "kg",
                onhand: 1250.0,
                allocated: 300.0,
                last_update: "2025-09-05T06:00:00Z",
              },
            },
          ],
        },
      ],
    },
    // SCHEDULING
    {
      id: "sched",
      name: "sched",
      path: "v1/FY-Fab/sched",
      description: "Scheduling draft plans and dispatch actions",
      children: [
        {
          id: "sched_site",
          name: "site",
          path: "v1/FY-Fab/sched/site",
          description: "Site-level grouping for sched plans and queues",
          children: [
            {
              id: "plan_draft",
              name: "plan_draft",
              path: "v1/FY-Fab/sched/site/info/plan_draft",
              type: "info",
              estMps: 0.2,
              description: "Draft production plan proposals before dispatch (does not start execution).",
              template: {
                plan_id: "PLAN-2025-09-05-01",
                gen_ts: "2025-09-05T06:10:00Z",
                order_id: "PO-202507-0001",
                product_id: "P-M6",
                step_code: "THREAD",
                target_station: "THREAD1",
                job_id: "JOB-000123",
                batch_qty: 500,
                est_start_ts: "2025-09-05T08:00:00Z",
                est_end_ts: "2025-09-05T08:06:00Z",
                need_mold: "MOLD-THR-A",
                need_changeover: "Y",
              },
            },
            {
              id: "push_to_queue",
              name: "push_to_queue",
              path: "v1/FY-Fab/sched/site/action/push_to_queue",
              type: "action",
              estMps: 0.05,
              description: "Action to send selected plan jobs into device queues (append/priority).",
              template: {
                plan_id: "PLAN-2025-09-05-01",
                job_id: "JOB-000123",
                target_function: "ch",
                target_station: "THREAD1",
                dispatch_mode: "append",
              },
            },
            {
              id: "queue_snapshot",
              name: "queue_snapshot",
              path: "v1/FY-Fab/sched/site/state/queue_snapshot",
              type: "state",
              estMps: 0.1,
              description: "Aggregated view of station queues: counts of queued/running jobs.",
              template: {
                snapshot_ts: "2025-09-05T07:59:30Z",
                station_count: 6,
                queued_jobs: 14,
                running_jobs: 3,
              },
            },
          ],
        },
      ],
    },
    // SHEET METAL LINE
    {
      id: "sm",
      name: "sm",
      path: "v1/FY-Fab/sm",
      description: "Sheet metal production line topics (LASER/BEND/COAT/ASSY)",
      children: [
        // LASER1
        {
          id: "sm_laser1",
          name: "LASER1",
          path: "v1/FY-Fab/sm/LASER1",
          description: "LASER1 station for laser cutting",
          children: [
            {
              id: "laser1_state_current",
              name: "current_job",
              path: "v1/FY-Fab/sm/LASER1/state/current_job",
              type: "state",
              estMps: 1,
              description: "State of current job running on LASER1: queued/running/done with timestamps.",
              template: { job_id: "JOB-000101", status: "queued", batch_qty: 300 },
            },
            {
              id: "laser1_dispatch",
              name: "dispatch_task",
              path: "v1/FY-Fab/sm/LASER1/action/dispatch_task",
              type: "action",
              estMps: 0.2,
              description: "Scheduler pushes a job item into LASER1 queue.",
              template: { job_id: "JOB-000101", order_id: "PO-202507-0002", product_id: "P-SHEET-01", step_code: "LASER", batch_qty: 300 },
            },
            {
              id: "laser1_start",
              name: "start_task",
              path: "v1/FY-Fab/sm/LASER1/action/start_task",
              type: "action",
              estMps: 0.2,
              description: "Operator/HMI triggers the start of current job on LASER1.",
              template: { job_id: "JOB-000101", operator_id: "OP-012", expect_minutes: 5 },
            },
            {
              id: "laser1_complete",
              name: "complete_task",
              path: "v1/FY-Fab/sm/LASER1/action/complete_task",
              type: "action",
              estMps: 0.2,
              description: "Operator/HMI completes current job on LASER1, reporting good quantity.",
              template: { job_id: "JOB-000101", operator_id: "OP-012", good_qty: 300, end_reason: "normal" },
            },
            {
              id: "laser1_metrics_cycle",
              name: "cycle_ms",
              path: "v1/FY-Fab/sm/LASER1/metrics/cycle_ms",
              type: "metrics",
              estMps: 2.5,
              description: "Cycle time measurements from LASER1 captured by device controller.",
              template: { cycle_ms: 4500 },
            },
          ],
        },
        // COAT1 (with cleaning)
        {
          id: "sm_coat1",
          name: "COAT1",
          path: "v1/FY-Fab/sm/COAT1",
          description: "COAT1 station for powder coating with cleaning rules",
          children: [
            {
              id: "coat_info_clean_rule",
              name: "clean_rule",
              path: "v1/FY-Fab/sm/COAT1/info/clean_rule",
              type: "info",
              estMps: 0.001,
              description: "Cleaning rule definition: minimum clean time and trigger condition.",
              template: { min_clean_time_min: 10, trigger_on_color_change: "Y" },
            },
            {
              id: "coat_state_clean_status",
              name: "clean_status",
              path: "v1/FY-Fab/sm/COAT1/state/clean_status",
              type: "state",
              estMps: 0.02,
              description: "Current cleaning status of COAT1: idle/running/done.",
              template: { status: "idle", start_ts: "" },
            },
            {
              id: "coat_action_clean_start",
              name: "clean_start",
              path: "v1/FY-Fab/sm/COAT1/action/clean_start",
              type: "action",
              estMps: 0.01,
              description: "Action to start cleaning cycle on COAT1 (system or operator triggered).",
              template: { by: "system", reason: "color_change" },
            },
          ],
        },
      ],
    },
    // COLD HEADING LINE
    {
      id: "ch",
      name: "ch",
      path: "v1/FY-Fab/ch",
      description: "Cold heading line topics (CUTWIRE/COLD/THREAD/HT)",
      children: [
        {
          id: "ch_cold1",
          name: "COLD1",
          path: "v1/FY-Fab/ch/COLD1",
          description: "Cold heading machine COLD1",
          children: [
            {
              id: "cold1_current_mold",
              name: "current_mold",
              path: "v1/FY-Fab/ch/COLD1/state/current_mold",
              type: "state",
              estMps: 0.02,
              description: "Current mold mounted on COLD1 and its life usage.",
              template: { mold_id: "MOLD-COLD-A", since_ts: "2025-09-05T07:40:00Z", life_used_cycles: 3200 },
            },
            {
              id: "cold1_change_mold",
              name: "change_mold",
              path: "v1/FY-Fab/ch/COLD1/action/change_mold",
              type: "action",
              estMps: 0.01,
              description: "Action to change mold on COLD1 with an estimated setup time.",
              template: { to_mold: "MOLD-COLD-A", reason: "product_switch", est_setup_min: 10 },
            },
            {
              id: "cold1_dispatch",
              name: "dispatch_task",
              path: "v1/FY-Fab/ch/COLD1/action/dispatch_task",
              type: "action",
              estMps: 0.2,
              description: "Scheduler pushes a job item into COLD1 queue.",
              template: { job_id: "JOB-000120", order_id: "PO-202507-0001", product_id: "P-M6", step_code: "COLD", batch_qty: 500, need_mold: "MOLD-COLD-A" },
            },
            {
              id: "cold1_metrics_good",
              name: "good_count",
              path: "v1/FY-Fab/ch/COLD1/metrics/good_count",
              type: "metrics",
              estMps: 2.0,
              description: "Good part counter reported by COLD1.",
              template: { count: 120 },
            },
            {
              id: "cold1_metrics_energy",
              name: "energy_kwh",
              path: "v1/FY-Fab/ch/COLD1/metrics/energy_kwh",
              type: "metrics",
              estMps: 0.5,
              description: "Energy consumption kWh metering from COLD1.",
              template: { kwh: 3.2 },
            },
          ],
        },
        {
          id: "ch_thread1",
          name: "THREAD1",
          path: "v1/FY-Fab/ch/THREAD1",
          description: "Thread rolling machine THREAD1",
          children: [
            {
              id: "thread1_current_mold",
              name: "current_mold",
              path: "v1/FY-Fab/ch/THREAD1/state/current_mold",
              type: "state",
              estMps: 0.02,
              description: "Current mold mounted on THREAD1 and its life usage.",
              template: { mold_id: "MOLD-THR-A", since_ts: "2025-09-05T07:50:00Z", life_used_cycles: 820 },
            },
            {
              id: "thread1_dispatch",
              name: "dispatch_task",
              path: "v1/FY-Fab/ch/THREAD1/action/dispatch_task",
              type: "action",
              estMps: 0.2,
              description: "Scheduler pushes a job item into THREAD1 queue.",
              template: { job_id: "JOB-000123", order_id: "PO-202507-0001", product_id: "P-M6", step_code: "THREAD", batch_qty: 500, need_mold: "MOLD-THR-A", due_date: "2025-07-20", priority: 50 },
            },
            {
              id: "thread1_state_current",
              name: "current_job",
              path: "v1/FY-Fab/ch/THREAD1/state/current_job",
              type: "state",
              estMps: 1,
              description: "State of current job running on THREAD1 with timestamps and batch size.",
              template: { job_id: "JOB-000123", status: "queued", queued_ts: "2025-09-05T08:00:00Z", start_ts: "", end_ts: "", batch_qty: 500 },
            },
            {
              id: "thread1_start",
              name: "start_task",
              path: "v1/FY-Fab/ch/THREAD1/action/start_task",
              type: "action",
              estMps: 0.2,
              description: "Operator/HMI starts the current job on THREAD1.",
              template: { job_id: "JOB-000123", operator_id: "OP-007", expect_minutes: 6 },
            },
            {
              id: "thread1_complete",
              name: "complete_task",
              path: "v1/FY-Fab/ch/THREAD1/action/complete_task",
              type: "action",
              estMps: 0.2,
              description: "Operator/HMI completes the current job on THREAD1 with good quantity.",
              template: { job_id: "JOB-000123", operator_id: "OP-007", good_qty: 500, end_reason: "normal" },
            },
          ],
        },
        {
          id: "ch_ht1",
          name: "HT1",
          path: "v1/FY-Fab/ch/HT1",
          description: "Heat treatment station HT1",
          children: [
            {
              id: "ht1_state_batch",
              name: "batch_status",
              path: "v1/FY-Fab/ch/HT1/state/batch_status",
              type: "state",
              estMps: 0.05,
              description: "Current batch status on HT1: idle/running/done.",
              template: { job_id: "JOB-000140", status: "idle" },
            },
            {
              id: "ht1_start",
              name: "start_task",
              path: "v1/FY-Fab/ch/HT1/action/start_task",
              type: "action",
              estMps: 0.1,
              description: "Operator/HMI starts the batch on HT1.",
              template: { job_id: "JOB-000140", operator_id: "OP-021", expect_minutes: 30 },
            },
            {
              id: "ht1_complete",
              name: "complete_task",
              path: "v1/FY-Fab/ch/HT1/action/complete_task",
              type: "action",
              estMps: 0.1,
              description: "Operator/HMI completes the batch on HT1 with reported good quantity.",
              template: { job_id: "JOB-000140", operator_id: "OP-021", good_qty: 500 },
            },
          ],
        },
      ],
    },
  ],
};

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

  // 4) plan_draft exists and is info
  const planDraft = leaves.find((n) => n.path.endsWith("/info/plan_draft"));
  results.push({ name: "plan_draft exists & is info", pass: !!planDraft && planDraft.type === "info" });

  // 5) export→import roundtrip keeps leaf count
  const compact = toCompact(root);
  const rebuilt = fromCompact(compact);
  const t5 = collectLeaves(root).filter((n) => n.type).length === collectLeaves(rebuilt).filter((n) => n.type).length;
  results.push({ name: "Export/Import roundtrip leaf count", pass: t5 });

  // 6) All leaf types are valid
  const validTypes: TopicType[] = ["metrics", "state", "action", "info"];
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
            <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs overflow-auto">{JSON.stringify(node.template, null, 2)}</pre>
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
              {node.type === "info" && <li>Published by sourceflow/eventflow</li>}
              {!node.type && <li>Folder level (no publisher)</li>}
            </ul>
          </div>
          <div>
            <SectionTitle>Subscribing</SectionTitle>
            <ul className="mt-1 text-sm text-gray-700 list-disc list-inside">
              {node.type === "metrics" && <li>Subscribed by BI dashboards / eventflow</li>}
              {(node.type === "state" || node.type === "action" || node.type === "info") && <li>Subscribed by eventflow microservices</li>}
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
    return { metrics: sum("metrics"), others: sum("state") + sum("action") + sum("info"), all: sum(undefined) };
  }, [allLeaves]);

  return (
    <Card>
      <div className="p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-indigo-600"/><span className="text-sm text-gray-600">Metrics</span><span className="font-mono text-sm">{totals.metrics.toFixed(3)} msg/s</span></div>
        <div className="flex items-center gap-2"><HardDrive className="w-4 h-4 text-slate-600"/><span className="text-sm text-gray-600">State/Action/Info</span><span className="font-mono text-sm">{totals.others.toFixed(3)} msg/s</span></div>
        <div className="ml-auto flex items-center gap-2"><Info className="w-4 h-4 text-gray-500"/><span className="text-sm text-gray-600">Total</span><span className="font-mono text-sm">{totals.all.toFixed(3)} msg/s</span></div>
      </div>
    </Card>
  );
};

// ---------- Main ----------
export default function UNSInteractiveBrowser() {
  const [data, setData] = useState<Node>(initialDATA);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true, erp: true, plm: true, tool: true, wh: true, sched: true, sm: true, ch: true });
  const [selected, setSelected] = useState<Node>();
  const [search, setSearch] = useState("");

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">UNS Interactive Browser <span className="text-gray-400 text-lg">– FY-Fab (v1)</span></h1>
          <p className="text-sm text-gray-600 mt-1">Browse topics, view payload templates, run self-tests, and <b>copy/paste</b> full JSON for import/export.</p>
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
            <TypeBadge type="info" />
          </div>
        </div>

        {/* Copy/Paste Import/Export */}
        <Card>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <SectionTitle>Export (full JSON)</SectionTitle>
              <div className="mt-2">
                <textarea
                  className="w-full h-64 font-mono text-xs border rounded-xl p-3 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
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
                  className="w-full h-64 font-mono text-xs border rounded-xl p-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
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
            <span className="inline-flex items-center gap-1"><HardDrive className="w-3.5 h-3.5"/>state/action/info → JSONB (transactional)</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/>ID kept in payload to avoid topic explosion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
