import { Node, TopicType } from './page';

export interface MqttTopicData {
  topic: string;
  messageCount: number;
  lastMessage?: {
    timestamp: Date;
    payload: string;
  };
}

export interface MqttStats {
  connected: boolean;
  messageCount: number;
  topics: Map<string, number>;
  lastMessage?: {
    topic: string;
    timestamp: Date;
    payload: string;
  };
}

/**
 * Convert MQTT topic path to UNS namespace structure
 */
export const parseUnsPath = (topic: string): string[] => {
  return topic.split('/').filter(segment => segment.length > 0);
};

/**
 * Determine topic type from path
 */
export const getTopicTypeFromPath = (path: string): TopicType | null => {
  const segments = parseUnsPath(path);
  
  // Look for type indicators in the path
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i].toLowerCase();
    if (segment === 'state' || segment === 'action' || segment === 'metrics') {
      return segment as TopicType;
    }
  }
  
  return null;
};

/**
 * Calculate real-time MPS (Messages Per Second) from message count and time window
 */
export const calculateRealTimeMps = (
  messageCount: number,
  timeWindowMs: number = 60000 // 1 minute window
): number => {
  if (timeWindowMs <= 0) return 0;
  return (messageCount * 1000) / timeWindowMs;
};

/**
 * Convert MQTT stats to UNS Node structure
 */
export const convertMqttToUnsNodes = (mqttStats: MqttStats): Node[] => {
  if (!mqttStats.connected || mqttStats.topics.size === 0) {
    return [];
  }

  const rootMap = new Map<string, Node>();
  
  const ensureNode = (path: string): Node => {
    if (rootMap.has(path)) return rootMap.get(path)!;
    
    const segments = parseUnsPath(path);
    const id = segments.join('/');
    const name = segments[segments.length - 1] || 'root';
    
    const node: Node = { 
      id, 
      name, 
      path,
      children: []
    };
    
    rootMap.set(path, node);
    
    // Link to parent
    if (segments.length > 1) {
      const parentPath = segments.slice(0, -1).join('/');
      const parent = ensureNode(parentPath);
      if (!parent.children) parent.children = [];
      if (!parent.children.find((c) => c.path === path)) {
        parent.children.push(node);
      }
    }
    
    return node;
  };

  // Process all MQTT topics
  mqttStats.topics.forEach((messageCount, topic) => {
    const node = ensureNode(topic);
    const topicType = getTopicTypeFromPath(topic);
    
    if (topicType) {
      node.type = topicType;
      node.estMps = calculateRealTimeMps(messageCount);
      node.description = `Real-time topic with ${messageCount} messages`;
      
      // Try to parse last message as template
      if (mqttStats.lastMessage && mqttStats.lastMessage.topic === topic) {
        try {
          const payload = JSON.parse(mqttStats.lastMessage.payload);
          node.template = payload;
        } catch {
          // If not JSON, store as string
          node.template = { raw: mqttStats.lastMessage.payload };
        }
      }
    }
  });

  // Return root nodes (top-level namespaces)
  const rootNodes: Node[] = [];
  rootMap.forEach((node) => {
    const segments = parseUnsPath(node.path);
    if (segments.length === 1) { // Top-level namespace
      rootNodes.push(node);
    }
  });

  return rootNodes;
};

/**
 * Merge static UNS data with real-time MQTT data
 */
export const mergeUnsWithMqtt = (staticData: Node, mqttNodes: Node[]): Node => {
  // Create a deep copy of static data
  const merged = JSON.parse(JSON.stringify(staticData));
  
  // If no MQTT data, return static data
  if (mqttNodes.length === 0) {
    return merged;
  }

  // Merge MQTT nodes into static structure
  const mergeNode = (staticNode: Node, mqttNode: Node) => {
    // Update real-time data if paths match
    if (staticNode.path === mqttNode.path && mqttNode.type) {
      staticNode.type = mqttNode.type;
      staticNode.estMps = mqttNode.estMps;
      staticNode.description = mqttNode.description;
      staticNode.template = mqttNode.template;
    }
    
    // Recursively merge children
    if (staticNode.children && mqttNode.children) {
      mqttNode.children.forEach(mqttChild => {
        const staticChild = staticNode.children?.find(sc => sc.path === mqttChild.path);
        if (staticChild) {
          mergeNode(staticChild, mqttChild);
        } else {
          // Add new MQTT-only nodes
          staticNode.children?.push(mqttChild);
        }
      });
    }
  };

  // Merge each MQTT root node
  mqttNodes.forEach(mqttRoot => {
    const staticRoot = merged.children?.find((child: Node) => child.path === mqttRoot.path);
    if (staticRoot) {
      mergeNode(staticRoot, mqttRoot);
    } else {
      // Add new MQTT-only root namespace
      if (!merged.children) merged.children = [];
      merged.children.push(mqttRoot);
    }
  });

  return merged;
};

/**
 * Calculate aggregated MPS statistics
 */
export const calculateMpsStats = (nodes: Node[]): {
  totalMps: number;
  metricsMps: number;
  stateActionMps: number;
  topicCounts: { [key in TopicType]: number };
} => {
  let totalMps = 0;
  let metricsMps = 0;
  let stateActionMps = 0;
  const topicCounts = { metrics: 0, state: 0, action: 0 };

  const traverse = (node: Node) => {
    if (node.type && node.estMps) {
      totalMps += node.estMps;
      topicCounts[node.type]++;
      
      if (node.type === 'metrics') {
        metricsMps += node.estMps;
      } else {
        stateActionMps += node.estMps;
      }
    }
    
    if (node.children) {
      node.children.forEach(traverse);
    }
  };

  nodes.forEach(traverse);

  return {
    totalMps,
    metricsMps,
    stateActionMps,
    topicCounts,
  };
};
